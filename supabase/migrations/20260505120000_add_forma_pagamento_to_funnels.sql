ALTER TABLE consultas ADD COLUMN IF NOT EXISTS forma_pagamento text;
ALTER TABLE espirometria ADD COLUMN IF NOT EXISTS forma_pagamento text;
ALTER TABLE broncoscopia ADD COLUMN IF NOT EXISTS forma_pagamento text;
ALTER TABLE procedimentos_cirurgicos ADD COLUMN IF NOT EXISTS forma_pagamento text;
