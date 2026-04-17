-- create and link tables
CREATE TABLE public.litters (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    mother_id BIGINT,
    father_id BIGINT,
    
    birth_date DATE NOT NULL,
    name TEXT,
    size INTEGER,
    notes TEXT
);
CREATE TABLE public.cats (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    litter_id BIGINT,
    mother_id BIGINT,
    father_id BIGINT,

    birth_date TIMESTAMPTZ,
    death_date TIMESTAMPTZ,
    missing_since TIMESTAMPTZ,

    status TEXT CHECK (status IN ('alive', 'dead', 'missing')),

    name TEXT,
    eye_color TEXT,
    fur_pattern TEXT,
    fur_length TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),

    notes TEXT,
    fur_color TEXT[]
);
-- cats → litters
ALTER TABLE public.cats
ADD CONSTRAINT fk_cats_litter
FOREIGN KEY (litter_id)
REFERENCES public.litters(id)
ON DELETE SET NULL;

-- cats → cats (self-reference for parents)
ALTER TABLE public.cats
ADD CONSTRAINT fk_cats_mother
FOREIGN KEY (mother_id)
REFERENCES public.cats(id)
ON DELETE SET NULL;

ALTER TABLE public.cats
ADD CONSTRAINT fk_cats_father
FOREIGN KEY (father_id)
REFERENCES public.cats(id)
ON DELETE SET NULL;

-- litters → cats (mother/father of litter)
ALTER TABLE public.litters
ADD CONSTRAINT fk_litters_mother
FOREIGN KEY (mother_id)
REFERENCES public.cats(id)
ON DELETE SET NULL;

ALTER TABLE public.litters
ADD CONSTRAINT fk_litters_father
FOREIGN KEY (father_id)
REFERENCES public.cats(id)
ON DELETE SET NULL;

-- Create sequences
CREATE SEQUENCE cats_id_seq;
CREATE SEQUENCE litters_id_seq;

-- Attach sequences to columns
ALTER TABLE public.cats
ALTER COLUMN id SET DEFAULT nextval('cats_id_seq');

ALTER TABLE public.litters
ALTER COLUMN id SET DEFAULT nextval('litters_id_seq');

SELECT setval('cats_id_seq', (SELECT MAX(id) FROM public.cats));
SELECT setval('litters_id_seq', (SELECT MAX(id) FROM public.litters));

ALTER SEQUENCE cats_id_seq OWNED BY public.cats.id;
ALTER SEQUENCE litters_id_seq OWNED BY public.litters.id;

-- enums + function

CREATE FUNCTION public.get_enum_values(enum_name text) RETURNS text[]
    LANGUAGE sql STABLE
    AS $$
SELECT array_agg(enumlabel ORDER BY enumsortorder)
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = enum_name;
$$;


ALTER FUNCTION public.get_enum_values(enum_name text) OWNER TO postgres;


--
-- Name: cat_color; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cat_color AS ENUM (
    'black',
    'white',
    'brown',
    'cinnamon',
    'blue',
    'lilac',
    'fawn',
    'orange',
    'cream',
    'olive',
    'grey'
);


ALTER TYPE public.cat_color OWNER TO postgres;

--
-- Name: cat_eye_color; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cat_eye_color AS ENUM (
    'amber',
    'copper',
    'yellow',
    'green',
    'blue',
    'hazel',
    'aqua',
    'odd_eyed',
    'dichroic'
);


ALTER TYPE public.cat_eye_color OWNER TO postgres;

--
-- Name: cat_fur_length; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cat_fur_length AS ENUM (
    'hairless',
    'short',
    'medium',
    'long'
);


ALTER TYPE public.cat_fur_length OWNER TO postgres;

--
-- Name: cat_pattern; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cat_pattern AS ENUM (
    'solid',
    'classic_tabby',
    'mackerel_tabby',
    'spotted_tabby',
    'ticked_tabby',
    'tortoiseshell',
    'calico',
    'dilute_tortoiseshell',
    'dilute_calico',
    'torbie',
    'tuxedo',
    'van',
    'harlequin',
    'mitted',
    'locket',
    'colorpoint',
    'lynx_point',
    'tortie_point',
    'flame_point',
    'smoke',
    'shaded',
    'chinchilla',
    'silver'
);


ALTER TYPE public.cat_pattern OWNER TO postgres;

--
-- Name: cat_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cat_status AS ENUM (
    'alive',
    'dead',
    'missing'
);


ALTER TYPE public.cat_status OWNER TO postgres;

--
-- Name: gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender AS ENUM (
    'male',
    'female'
);


ALTER TYPE public.gender OWNER TO postgres;
