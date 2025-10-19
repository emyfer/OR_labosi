--
-- PostgreSQL database dump
--

\restrict z8ELSoX7k9cD8GS0ZRdsmUbYVUZwNWq3vxWw3bTqf50cWf6w8LZ9gINU9WyNRyt

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-10-19 12:04:45

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 24610)
-- Name: drzave; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drzave (
    naziv character varying(100) NOT NULL,
    glavni_grad character varying(100),
    jezik character varying(50),
    trajanje_putovanja integer,
    valuta character varying(20),
    godina_posjete integer,
    tip_putovanja character varying(100),
    prijevoz character varying(50),
    ocjena integer,
    broj_stanovnika integer
);


ALTER TABLE public.drzave OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24618)
-- Name: gradovi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gradovi (
    grad_naziv character varying(100),
    broj_stanovnika integer,
    aktivnost character varying(100),
    drzava character varying(100)
);


ALTER TABLE public.gradovi OWNER TO postgres;

--
-- TOC entry 5009 (class 0 OID 24610)
-- Dependencies: 219
-- Data for Name: drzave; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drzave (naziv, glavni_grad, jezik, trajanje_putovanja, valuta, godina_posjete, tip_putovanja, prijevoz, ocjena, broj_stanovnika) FROM stdin;
Italija	Rim	talijanski	3	euro	2025	samostalno	avion	7	58989749
Belgija	Brisel	francuski	4	euro	2024	samostalno	avion	8	11764398
Mađarska	Budimpešta	mađarski	2	forinte	2022	agencija	auto	5	9619184
Slovenija	Ljubljana	slovenski	7	euro	2023	samostalno	auto	8	2116599
Crna Gora	Podgorica	crnogorski	5	euro	2024	samostalno	avion	9	631041
Španjolska	Madrid	španjolski	6	euro	2025	agencija	autobus	10	47889958
Francuska	Paris	francuski	4	euro	2023	agencija	avion	8	66680404
Engleska	London	engleski	7	funte	2024	samostalno	avion	10	69671987
Austrija	Beč	njemački	3	euro	2022	agencija	autobus	6	9113574
Češka	Prag	češki	4	krune	2025	samostalno	autobus	10	10570801
\.


--
-- TOC entry 5010 (class 0 OID 24618)
-- Dependencies: 220
-- Data for Name: gradovi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gradovi (grad_naziv, broj_stanovnika, aktivnost, drzava) FROM stdin;
London	8900000	Mjuzikl	Engleska
Brighton	290000	Fish and Chips	Engleska
Beč	1900000	Advent	Austrija
Graz	330000	Šoping	Austrija
Linz	205000	Torta Sacher	Austrija
Pisa	90000	Kosi toranj	Italija
Florenca	380000	Muzej Uffizi	Italija
Brisel	120000	More	Belgija
Oostende	70000	More	Belgija
Podgorica	200000	Vodopad	Crna Gora
Tivat	15000	Razgledavanje	Crna Gora
Kotor	23000	Cable car	Crna Gora
Budva	18000	Ručak	Crna Gora
Budimpešta	1750000	Advent	Mađarska
Prag	1300000	Koncert	Češka
Lile	233000	Izlet vlakom	Francuska
Marseille	870000	Sajam	Francuska
Nice	340000	Sviranje klavira	Francuska
Cannes	74000	Besplatni sladoled	Francuska
Barcelona	1600000	Plaža i pizza	Španjolska
Montserrat	10000	Samostan	Španjolska
Ljubljana	295000	Penjanje na brdo	Slovenija
Maribor	95000	Advent	Slovenija
Koper	25000	Plaža	Slovenija
Piran	4500	Razgledavanje	Slovenija
\.


--
-- TOC entry 4860 (class 2606 OID 24617)
-- Name: drzave drzave_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drzave
    ADD CONSTRAINT drzave_pkey PRIMARY KEY (naziv);


--
-- TOC entry 4861 (class 2606 OID 24621)
-- Name: gradovi gradovi_drzava_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gradovi
    ADD CONSTRAINT gradovi_drzava_fkey FOREIGN KEY (drzava) REFERENCES public.drzave(naziv);


-- Completed on 2025-10-19 12:04:45

--
-- PostgreSQL database dump complete
--

\unrestrict z8ELSoX7k9cD8GS0ZRdsmUbYVUZwNWq3vxWw3bTqf50cWf6w8LZ9gINU9WyNRyt

