alter table public.consultas
  drop column if exists tag_name_contato;

alter table public.espirometria
  drop column if exists tag_name_contato;

alter table public.broncoscopia
  drop column if exists tag_name_contato;

alter table public.procedimentos_cirurgicos
  drop column if exists tag_name_contato;
