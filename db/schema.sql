-- Governou — esquema do banco (Postgres / Neon)
-- Princípio: nenhum número ou fato entra sem fonte. Tudo que veio de pesquisa
-- (e não de API oficial) nasce com status 'pendente' até revisão humana.

create table if not exists indicator (
  id               text primary key,
  name             text not null,
  unit             text not null,
  higher_is_better boolean not null,
  official_source  text not null,
  source_url       text,
  notes            text
);

create table if not exists indicator_value (
  indicator_id text not null references indicator(id) on delete cascade,
  year         smallint not null check (year between 1990 and 2100),
  value        double precision not null,
  -- 'api' = baixado da API oficial (BCB/IBGE); 'pesquisa' = levantado em publicação citada
  origin       text not null check (origin in ('api', 'pesquisa')),
  source_url   text,
  status       text not null default 'pendente' check (status in ('pendente', 'revisado')),
  updated_at   timestamptz not null default now(),
  primary key (indicator_id, year)
);

create table if not exists source (
  id         serial primary key,
  url        text not null unique,
  outlet     text not null,
  title      text not null,
  published  date,
  -- título reconstruído do link ou data estimada: precisa de conferência
  approx     boolean not null default false
);

create table if not exists gov_event (
  id        text primary key,
  term_id   text not null check (term_id in ('lula2', 'dilma1', 'dilma2', 'temer', 'bolsonaro', 'lula3')),
  date      date not null,
  title     text not null,
  summary   text not null,
  impact    text not null check (impact in ('positivo', 'negativo', 'misto')),
  area      text not null,
  weight    smallint not null check (weight between 1 and 3),
  evidence  text,
  status    text not null default 'pendente' check (status in ('pendente', 'revisado'))
);

create table if not exists gov_event_source (
  event_id  text not null references gov_event(id) on delete cascade,
  source_id int  not null references source(id) on delete cascade,
  primary key (event_id, source_id)
);

create table if not exists factcheck (
  id          text primary key,
  claim       text not null,
  claimant    text not null,
  about       text[] not null default '{}',
  date        date not null,
  date_approx boolean not null default false,
  verdict     text not null check (verdict in ('falso', 'enganoso', 'exagerado', 'sem-contexto', 'verdadeiro', 'impreciso')),
  explanation text not null,
  topic       text not null,
  status      text not null default 'pendente' check (status in ('pendente', 'revisado'))
);

create table if not exists factcheck_source (
  factcheck_id text not null references factcheck(id) on delete cascade,
  source_id    int  not null references source(id) on delete cascade,
  primary key (factcheck_id, source_id)
);

create index if not exists gov_event_term_idx on gov_event (term_id, date);
create index if not exists factcheck_date_idx on factcheck (date desc);

-- Resultado do 2º turno por UF nas eleições que elegeram cada presidente
create table if not exists election (
  year        smallint not null,
  round       smallint not null check (round in (1, 2)),
  winner      text not null,
  candidates  jsonb not null,           -- [{id, name, party}]
  national    jsonb not null,           -- {candidato: % votos válidos}
  source_url  text,
  notes       text,
  primary key (year, round)
);

create table if not exists election_state (
  year        smallint not null,
  round       smallint not null,
  uf          char(2) not null,
  shares      jsonb not null,           -- {candidato: % votos válidos}
  source_url  text,
  status      text not null default 'pendente' check (status in ('pendente', 'revisado')),
  primary key (year, round, uf),
  foreign key (year, round) references election (year, round) on delete cascade
);

-- Ficha biográfica de cada presidente
create table if not exists president_bio (
  id               text primary key,
  full_name        text not null,
  birth_date       date,
  birth_place      text,
  profession       text,
  previous_offices text[] not null default '{}',
  sources          jsonb not null default '[]',
  status           text not null default 'pendente' check (status in ('pendente', 'revisado'))
);
