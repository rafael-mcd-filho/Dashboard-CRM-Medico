import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const parseArgs = (argv) => {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      result[key] = "true";
      continue;
    }

    result[key] = next;
    index += 1;
  }

  return result;
};

const args = parseArgs(process.argv.slice(2));

const printUsage = () => {
  console.log(
    "Usage: npm run create:dashboard-user -- --email <email> --password <password> --userids <id1,id2,id3>"
  );
};

const loadEnvFile = (filename) => {
  const filepath = resolve(process.cwd(), filename);

  if (!existsSync(filepath)) {
    return;
  }

  const content = readFileSync(filepath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

if (args.help === "true") {
  printUsage();
  process.exit(0);
}

const email = args.email?.trim();
const password = args.password ?? "";
const userIds = (args.userids ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const confirmEmail = args["confirm-email"] !== "false";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing environment variables. Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

if (!email || !password || userIds.length === 0) {
  printUsage();
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const findUserByEmail = async (targetEmail) => {
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const found = users.find((user) => user.email?.toLowerCase() === targetEmail.toLowerCase());

    if (found) {
      return found;
    }

    if (users.length < 200) {
      return null;
    }

    page += 1;
  }
};

const createOrReuseUser = async () => {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: confirmEmail,
  });

  if (!error && data.user) {
    return data.user;
  }

  const message = error?.message?.toLowerCase() ?? "";
  const alreadyExists =
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already registered");

  if (!alreadyExists) {
    throw error;
  }

  const existingUser = await findUserByEmail(email);

  if (!existingUser) {
    throw error;
  }

  const { data: updatedData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    existingUser.id,
    {
      password,
      email_confirm: confirmEmail,
    }
  );

  if (updateError) {
    throw updateError;
  }

  return updatedData.user;
};

try {
  const user = await createOrReuseUser();

  const permissionRows = userIds.map((externalUserId) => ({
    auth_user_id: user.id,
    external_userid: externalUserId,
    active: true,
  }));

  const { error: permissionError } = await supabaseAdmin
    .from("dashboard_access")
    .upsert(permissionRows, { onConflict: "auth_user_id,external_userid" });

  if (permissionError) {
    throw permissionError;
  }

  console.log(`User ready: ${user.email} (${user.id})`);
  console.log(`Permissions linked: ${userIds.join(", ")}`);
} catch (error) {
  console.error("Failed to create dashboard user.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
