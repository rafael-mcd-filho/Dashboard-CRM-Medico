import AbaAgenda from "./AbaAgenda";

export default function AgendaIsolada() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#EDF5FF_0%,#F7FAFD_42%,#EEF3F8_100%)] px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1800px]">
        <AbaAgenda />
      </div>
    </main>
  );
}
