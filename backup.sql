--
-- PostgreSQL database dump
--

\restrict c3mMbQvQH3dv6ydBcqoEzBwxKkHR2ozASlt3ejRseTqiStmNlUtfdh2JahpeQiD

-- Dumped from database version 17.8 (130b160)
-- Dumped by pg_dump version 17.9

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: EstadoGuia; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoGuia" AS ENUM (
    'PENDIENTE',
    'ENTREGADO',
    'INCIDENCIA'
);


--
-- Name: EstadoRuta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoRuta" AS ENUM (
    'PENDIENTE',
    'EN_CURSO',
    'COMPLETADA',
    'CANCELADA'
);


--
-- Name: EstadoSeguimientoChofer; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoSeguimientoChofer" AS ENUM (
    'NINGUNO',
    'EN_CAMINO',
    'CERCA_DESTINO'
);


--
-- Name: Rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Rol" AS ENUM (
    'ADMIN',
    'CHOFER',
    'CLIENTE'
);


--
-- Name: TipoCliente; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoCliente" AS ENUM (
    'PRINCIPAL',
    'SECUNDARIO'
);


--
-- Name: TipoFoto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoFoto" AS ENUM (
    'GUIA',
    'HOJA_RUTA'
);


--
-- Name: TipoNovedad; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoNovedad" AS ENUM (
    'DIRECCION_INCORRECTA',
    'CLIENTE_AUSENTE',
    'MERCADERIA_DANADA',
    'OTRO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cliente" (
    id text NOT NULL,
    nombre text NOT NULL,
    ruc text NOT NULL,
    direccion text NOT NULL,
    "telefonoContacto" text,
    "emailContacto" text,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientePrincipalId" text,
    tipo public."TipoCliente" DEFAULT 'SECUNDARIO'::public."TipoCliente" NOT NULL,
    lat double precision,
    lng double precision
);


--
-- Name: Foto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Foto" (
    id text NOT NULL,
    tipo public."TipoFoto" NOT NULL,
    "urlPreview" text NOT NULL,
    "publicId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "guiaId" text,
    "rutaId" text
);


--
-- Name: GuiaEntrega; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GuiaEntrega" (
    id text NOT NULL,
    "numeroGuia" text NOT NULL,
    descripcion text NOT NULL,
    estado public."EstadoGuia" DEFAULT 'PENDIENTE'::public."EstadoGuia" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "receptorNombre" text,
    "horaLlegada" text,
    "horaSalida" text,
    temperatura text,
    observaciones text,
    "clienteId" text NOT NULL,
    "rutaId" text NOT NULL,
    "stopId" text NOT NULL
);


--
-- Name: Novedad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Novedad" (
    id text NOT NULL,
    tipo public."TipoNovedad" NOT NULL,
    descripcion text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "guiaId" text NOT NULL
);


--
-- Name: Ruta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ruta" (
    id text NOT NULL,
    fecha text NOT NULL,
    estado public."EstadoRuta" DEFAULT 'PENDIENTE'::public."EstadoRuta" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "choferId" text NOT NULL,
    "seguimientoChofer" public."EstadoSeguimientoChofer" DEFAULT 'NINGUNO'::public."EstadoSeguimientoChofer" NOT NULL,
    nombre text
);


--
-- Name: SeguimientoNovedad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SeguimientoNovedad" (
    id text NOT NULL,
    nota text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "novedadId" text NOT NULL
);


--
-- Name: Stop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Stop" (
    id text NOT NULL,
    orden integer NOT NULL,
    direccion text NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "rutaId" text NOT NULL,
    "clienteId" text NOT NULL
);


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Usuario" (
    id text NOT NULL,
    nombre text NOT NULL,
    cedula text,
    email text NOT NULL,
    password text NOT NULL,
    rol public."Rol" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clienteId" text,
    "mustChangePassword" boolean DEFAULT false NOT NULL,
    "activeSessionToken" text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    celular text
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: ruta_seguimiento_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ruta_seguimiento_logs (
    id text NOT NULL,
    ruta_id text NOT NULL,
    chofer_id text NOT NULL,
    seguimiento_chofer text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: Cliente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Cliente" (id, nombre, ruc, direccion, "telefonoContacto", "emailContacto", activo, "createdAt", "updatedAt", "clientePrincipalId", tipo, lat, lng) FROM stdin;
cmoa6do7i000071fjkbnskj2k	pruebas	1728780766001	N34B, Quito - Pichincha, 1705, Ecuador	0984465478	kevin@gmail.com	t	2026-04-22 14:56:03.535	2026-04-22 14:56:03.535	\N	PRINCIPAL	-0.1843773429801985	-78.48132965087937
cmo303o9k000718s7n90wz55a	Hospital Metropolitano	1791234560004	Corso Vittorio Emanuele Ii 107, 83100 Avellino Avellino, Italia	2993150000	metropolitano@gmail.com	t	2026-04-17 14:25:56.121	2026-04-17 17:01:51.587	\N	SECUNDARIO	40.91422032305726	14.78896183069
cmo8n45il00018p6hu8sgxclv	HCAM	1768046450001	Portoviejo, Quito - Pichincha, 1704, Ecuador	0900000000	hcam@jdsjf.com	t	2026-04-21 13:09:00.525	2026-04-21 13:09:00.525	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.2057244236845293	-78.505043048305
cmo8n5igp00038p6how6mmi4l	simed	3423423534534	Avenida Río Amazonas, Quito - Pichincha, 1705, Ecuador	3248324838	qr432@dfdsf.cp	t	2026-04-21 13:10:03.961	2026-04-21 13:10:03.961	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.1751641364494674	-78.48507571546892
cmo302q8n0002utu86a9f4b4i	SIMED SA	1791234560001	Avenida de la Prensa, Quito - Pichincha, 1705, Ecuador	0962700039	logistica@cimed.ec	t	2026-04-17 14:25:12.023	2026-04-21 17:28:10.244	\N	PRINCIPAL	-0.1454414407881757	-78.49171428836019
cmo8x5wgi000m6xmziol9i82s	Dra Diana Pazmiño	1793207954001	Alemania, Quito - Pichincha, 1705, Ecuador	0000000000	dradianapaznar@gmail.com	t	2026-04-21 17:50:18.259	2026-04-21 17:50:18.259	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.1929092662129221	-78.4917857071516
cmo8x7fip000o6xmzbsu3aqgs	hodevalles	1791221753001	Avenida Florencia, Quito - Pichincha, 1709, Ecuador	0000000000	correo@transporte.com	t	2026-04-21 17:51:29.618	2026-04-21 17:51:29.618	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.2087685217800868	-78.42407682931146
cmo8zbs8q001d6xmz7a46uvsw	Prueba	1728392556001	Vía Interoceánica, Quito - Pichincha, 1705, Ecuador	7894561230	prueba@email.com	t	2026-04-21 18:50:51.962	2026-04-21 18:50:51.962	\N	PRINCIPAL	-0.186694759418387	-78.460043640137
cmo98ihx600012qxq3f43igdj	Universidad san fransisco	1791836154001	Diego de Robles, Quito - Pichincha, 1709, Ecuador	0000000000	transporte@trans.com	t	2026-04-21 23:08:01.722	2026-04-21 23:08:01.722	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.1970303794433761	-78.43677799081291
cmo98ltuk00032qxq4jbzbg3t	Carlos Guaman	1715270896001	Isla Seymour, Quito - Pichincha, 1705, Ecuador	0000000000	transporte@trans.com	t	2026-04-21 23:10:37.149	2026-04-21 23:10:37.149	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.1570156331295749	-78.48046140425735
cmo98ncdd00052qxq23xn7p1m	Veris	1792040531001	Avenida Río Amazonas, Quito - Pichincha, 1705, Ecuador	0000000000	transporte@trans.com	t	2026-04-21 23:11:47.809	2026-04-21 23:11:47.809	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.1535677511990485	-78.48817491001148
cmo98ovy600072qxqucimfk74	Solca	1791817680001	De las Avigiras, Quito - Pichincha, 1705, Ecuador	0000000000	transporte@trans.com	t	2026-04-21 23:12:59.838	2026-04-21 23:12:59.838	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.1377107503549979	-78.46909037030352
cmo98vegw000s2qxqdakxqgzr	MSP RIOBAMBA	0660801370001	Olmedo, Riobamba - Chimborazo, 0601, Ecuador	0000000000	transporte@trans.com	t	2026-04-21 23:18:03.777	2026-04-21 23:18:03.777	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-1.680541553210603	-78.64348312190234
cmo991bma000u2qxq1xifmy1n	OCHOA AMBATO	1891749933001	Avenida González Suárez, Ambato - Provincia de Tungurahua, 1801, Ecuador	0000000000	transporte@trans.com	t	2026-04-21 23:22:40.018	2026-04-21 23:22:40.018	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-1.235089372149744	-78.6189026999635
cmo994ycg000w2qxqo3pxauzx	OCHOA LATACUNGA	1891749934001	Laguna Colta, Latacunga - Cotopaxi, 0501, Ecuador	0000000000	transporte@trans.com	t	2026-04-21 23:25:29.44	2026-04-21 23:25:29.44	cmo302q8n0002utu86a9f4b4i	SECUNDARIO	-0.9305807150941376	-78.60301528058251
\.


--
-- Data for Name: Foto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Foto" (id, tipo, "urlPreview", "publicId", "createdAt", "guiaId", "rutaId") FROM stdin;
cmo8qcr2f000g11kgzyrk01a0	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776782379/medlogix/guias/y2bbsumoig3zfoozs9qk.jpg	medlogix/guias/y2bbsumoig3zfoozs9qk	2026-04-21 14:39:40.551	cmo8n86i1000i8p6h81nj12if	\N
cmo8rb8io000q11kghfykdbor	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776783988/medlogix/guias/aevfei5si9wldsqt9kfc.jpg	medlogix/guias/aevfei5si9wldsqt9kfc	2026-04-21 15:06:29.473	cmo8n86nx000m8p6h3tsawui6	\N
cmo8rxccp000s11kgqrdni6tn	HOJA_RUTA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776785020/medlogix/hojas_ruta/hu5eapeuoic2yq3ji1b3.jpg	medlogix/hojas_ruta/hu5eapeuoic2yq3ji1b3	2026-04-21 15:23:40.873	\N	cmo8n86a5000e8p6h9cp3qirb
cmo8xn28v00116xmzs1b1qxlh	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776794618/medlogix/guias/h7w7hjdmvqncb66vpiik.jpg	medlogix/guias/h7w7hjdmvqncb66vpiik	2026-04-21 18:03:38.912	cmo8xb20w000v6xmzvlchd7cg	\N
cmo8z8xwq001a6xmzmx9815l8	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776797318/medlogix/guias/cprbqptaoelgatwskvjl.png	medlogix/guias/cprbqptaoelgatwskvjl	2026-04-21 18:48:39.271	cmo8z87hp00186xmzze28b87d	\N
cmo8z95k3001c6xmz861hxk4v	HOJA_RUTA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776797328/medlogix/hojas_ruta/eysxukosnccrwur44gav.png	medlogix/hojas_ruta/eysxukosnccrwur44gav	2026-04-21 18:48:49.251	\N	cmo8z87a100146xmz9gmz40qy
cmo8zgw68001o6xmzlj57hexm	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776797689/medlogix/guias/ft3kwjy5ic9tk7pampfz.png	medlogix/guias/ft3kwjy5ic9tk7pampfz	2026-04-21 18:54:50.337	cmo8zeo5y001m6xmzjy8xvbl7	\N
cmo8zmb48001q6xmz4tqlym5e	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776797942/medlogix/guias/pmhi0nmt7q9hsel7ul3f.jpg	medlogix/guias/pmhi0nmt7q9hsel7ul3f	2026-04-21 18:59:02.984	cmo8xb26l000z6xmz55yg0t0r	\N
cmo8znsg5001s6xmzmgt8m51g	HOJA_RUTA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776798011/medlogix/hojas_ruta/ulyjjngwsa4voed76mup.jpg	medlogix/hojas_ruta/ulyjjngwsa4voed76mup	2026-04-21 19:00:12.101	\N	cmo8xb1ta000r6xmzr433myct
cmo8zqbaz001u6xmzn14fw1ex	HOJA_RUTA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776798129/medlogix/hojas_ruta/aonb0zuhjwemopamazwc.png	medlogix/hojas_ruta/aonb0zuhjwemopamazwc	2026-04-21 19:02:09.852	\N	cmo8zenya001i6xmzrq85ktbp
cmoa5j9s30001fn1v7xlc9i90	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776868344/medlogix/guias/srq2rfckmmwjwyymzi4c.jpg	medlogix/guias/srq2rfckmmwjwyymzi4c	2026-04-22 14:32:25.094	cmo98sblz000q2qxq950yz5ee	\N
cmoa5jcuv0003fn1vdynjb593	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776868348/medlogix/guias/grpqmkjlfzv0adgjyqz7.jpg	medlogix/guias/grpqmkjlfzv0adgjyqz7	2026-04-22 14:32:29.143	cmo98sblz000q2qxq950yz5ee	\N
cmoa6y7lb000471fjljfw9rt1	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776870721/medlogix/guias/j8oqrk7smmu3o84ooika.jpg	medlogix/guias/j8oqrk7smmu3o84ooika	2026-04-22 15:12:01.776	cmo98sbic000m2qxq5eqahvrz	\N
cmoa6yazm000671fjs4hzwazp	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776870725/medlogix/guias/eqqgouzbhyxlposgucfp.jpg	medlogix/guias/eqqgouzbhyxlposgucfp	2026-04-22 15:12:06.178	cmo98sbic000m2qxq5eqahvrz	\N
cmoa6ye1g000871fjhcn8hnum	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776870729/medlogix/guias/gar7xhuvydmkbke1nuz8.jpg	medlogix/guias/gar7xhuvydmkbke1nuz8	2026-04-22 15:12:10.132	cmo98sbic000m2qxq5eqahvrz	\N
cmoa6ygyu000a71fjz9pm9dst	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776870733/medlogix/guias/qw6mb9lvyscyxpbvi7el.jpg	medlogix/guias/qw6mb9lvyscyxpbvi7el	2026-04-22 15:12:13.861	cmo98sbic000m2qxq5eqahvrz	\N
cmoa6yjta000c71fjb98jg6d2	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776870736/medlogix/guias/yag9damagzguxqtgjezo.jpg	medlogix/guias/yag9damagzguxqtgjezo	2026-04-22 15:12:17.615	cmo98sbic000m2qxq5eqahvrz	\N
cmoa7nioi000v71fj8l1mfymx	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776871901/medlogix/guias/is1tvjajxawoddtbdfxs.jpg	medlogix/guias/is1tvjajxawoddtbdfxs	2026-04-22 15:31:42.479	cmo98sbeq000i2qxqev59ne86	\N
cmoa7nm7d000x71fj0prt5n8i	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776871906/medlogix/guias/ornd0bpee8mb8atwjqpi.jpg	medlogix/guias/ornd0bpee8mb8atwjqpi	2026-04-22 15:31:47.114	cmo98sbeq000i2qxqev59ne86	\N
cmoa7o0gr000z71fjxmqj3xrr	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776871925/medlogix/guias/sp6wsrx5bzfo1ntondbm.jpg	medlogix/guias/sp6wsrx5bzfo1ntondbm	2026-04-22 15:32:05.595	cmo997lo900132qxqceh672kk	\N
cmoa7otnc001171fj9n1mkhmr	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776871962/medlogix/guias/wpzatntyz8xqromcdaxk.jpg	medlogix/guias/wpzatntyz8xqromcdaxk	2026-04-22 15:32:43.416	cmo997lo900132qxqceh672kk	\N
cmoa9o6er001371fj0nuakvqt	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776875291/medlogix/guias/ttrcwmajjwh0bvixfkos.jpg	medlogix/guias/ttrcwmajjwh0bvixfkos	2026-04-22 16:28:12.532	cmo98sb96000e2qxqtr0xpsxz	\N
cmoa9odsd001571fj0y2d61a0	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776875301/medlogix/guias/rl1pe1bfbfwhqoztfry9.jpg	medlogix/guias/rl1pe1bfbfwhqoztfry9	2026-04-22 16:28:22.094	cmo98sb96000e2qxqtr0xpsxz	\N
cmoa9ov2w001771fjloi0kodq	HOJA_RUTA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776875323/medlogix/hojas_ruta/zhgnlcevcwbxaxwkdb7l.jpg	medlogix/hojas_ruta/zhgnlcevcwbxaxwkdb7l	2026-04-22 16:28:44.505	\N	cmo98sb1t000a2qxqmnncmvfy
cmoab6dwq00013ox6v43zpc34	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776877821/medlogix/guias/clk4x984k3sizkd3ifru.jpg	medlogix/guias/clk4x984k3sizkd3ifru	2026-04-22 17:10:21.675	cmo997ltx00172qxq3ywzuf0b	\N
cmoab6fjo00033ox6enhs2g35	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776877823/medlogix/guias/q9tehmuvzvrv7ko1jzbn.jpg	medlogix/guias/q9tehmuvzvrv7ko1jzbn	2026-04-22 17:10:23.797	cmo997ltx00172qxq3ywzuf0b	\N
cmoab6hye00053ox63xbt6yic	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776877826/medlogix/guias/gtznyxahkbwln4izmuec.jpg	medlogix/guias/gtznyxahkbwln4izmuec	2026-04-22 17:10:26.918	cmo997ltx00172qxq3ywzuf0b	\N
cmoae075l0003a88zftpokx4u	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776882571/medlogix/guias/mcumyeydlioeo0vfqh58.jpg	medlogix/guias/mcumyeydlioeo0vfqh58	2026-04-22 18:29:31.834	cmo997lxq001b2qxq1682lvy1	\N
cmoae0cer0005a88z8tdc9vku	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776882577/medlogix/guias/xyqaupnkjo1ldy6kgcp0.jpg	medlogix/guias/xyqaupnkjo1ldy6kgcp0	2026-04-22 18:29:38.644	cmo997lxq001b2qxq1682lvy1	\N
cmoae0h5d0007a88zaojzsyr1	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776882583/medlogix/guias/bnmv3wp3mwy9adhhz6zc.jpg	medlogix/guias/bnmv3wp3mwy9adhhz6zc	2026-04-22 18:29:44.785	cmo997lxq001b2qxq1682lvy1	\N
cmoae0lh70009a88zpdd62iba	GUIA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776882589/medlogix/guias/dvedxcszkymzr0ozqidd.jpg	medlogix/guias/dvedxcszkymzr0ozqidd	2026-04-22 18:29:50.395	cmo997lxq001b2qxq1682lvy1	\N
cmoae2kmd000ba88zn7er7j98	HOJA_RUTA	https://res.cloudinary.com/dwm3jwkwv/image/upload/v1776882682/medlogix/hojas_ruta/qqbgxs07jbpqv4g4kzsy.jpg	medlogix/hojas_ruta/qqbgxs07jbpqv4g4kzsy	2026-04-22 18:31:22.597	\N	cmo997lgn000z2qxqv69kofuu
\.


--
-- Data for Name: GuiaEntrega; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GuiaEntrega" (id, "numeroGuia", descripcion, estado, "createdAt", "updatedAt", "receptorNombre", "horaLlegada", "horaSalida", temperatura, observaciones, "clienteId", "rutaId", "stopId") FROM stdin;
cmo8xb20w000v6xmzvlchd7cg	G-058410-1	17671	ENTREGADO	2026-04-21 17:54:18.752	2026-04-21 18:03:33.001	Diana Pazmiño	12:50	13:02	2.0	\N	cmo8x5wgi000m6xmziol9i82s	cmo8xb1ta000r6xmzr433myct	cmo8xb1x3000t6xmzbzs357n8
cmo8z87hp00186xmzze28b87d	G-284756-1	Prueba	ENTREGADO	2026-04-21 18:48:05.102	2026-04-21 18:48:37.551	kl	13:48	13:54	14	jikl	cmo8x7fip000o6xmzbsu3aqgs	cmo8z87a100146xmz9gmz40qy	cmo8z87dv00166xmz6im2wxc8
cmo8zeo5y001m6xmzjy8xvbl7	G-586298-1	.lkikk	ENTREGADO	2026-04-21 18:53:06.647	2026-04-21 18:54:48.855	jkl	13:54	13:59	17	\N	cmo8zbs8q001d6xmz7a46uvsw	cmo8zenya001i6xmzrq85ktbp	cmo8zeo25001k6xmznklbleuy
cmo8xb26l000z6xmz55yg0t0r	G-058410-2	17671	ENTREGADO	2026-04-21 17:54:18.957	2026-04-21 18:58:54.949	Andrea Rodríguez	13:40	13:58	2.0	\N	cmo8x7fip000o6xmzbsu3aqgs	cmo8xb1ta000r6xmzr433myct	cmo8xb24p000x6xmz668el73z
cmo8n86i1000i8p6h81nj12if	G-128071-1	aaa	ENTREGADO	2026-04-21 13:12:08.425	2026-04-21 14:49:27.538	Evelin Alvarez	09:00	09:37	20	Retiro mesas	cmo8n45il00018p6hu8sgxclv	cmo8n86a5000e8p6h9cp3qirb	cmo8n86e3000g8p6hd6hsv12a
cmo98sblz000q2qxq950yz5ee	G-339312-4	178591 178567	ENTREGADO	2026-04-21 23:15:40.104	2026-04-22 14:32:19.706	MARCO MORALES  DIEGO QUINTANILLA	09:00	09:31	3.4	Retiro	cmo98ovy600072qxqucimfk74	cmo98sb1t000a2qxqmnncmvfy	cmo98sbk6000o2qxq1yoh4g9m
cmo8n86nx000m8p6h3tsawui6	G-128071-2	sss	ENTREGADO	2026-04-21 13:12:08.637	2026-04-21 15:06:22.616	Andrés Pérez	10:00	10:06	18	Retiro mesas	cmo8n5igp00038p6how6mmi4l	cmo8n86a5000e8p6h9cp3qirb	cmo8n86ly000k8p6hvf3y1mdz
cmo98sbic000m2qxq5eqahvrz	G-339312-3	86434	ENTREGADO	2026-04-21 23:15:39.973	2026-04-22 15:11:56.381	Jean Andrade	09:50	10:10	2.9	\N	cmo98ncdd00052qxq23xn7p1m	cmo98sb1t000a2qxqmnncmvfy	cmo98sbgj000k2qxqupxjy86j
cmoa7j0io000r71fjpqmagmpt	HOLA-MUNDO-SOY-DE VE LO PER	awdwad	PENDIENTE	2026-04-22 15:28:12.384	2026-04-22 15:28:12.384	\N	\N	\N	\N	\N	cmo8zbs8q001d6xmz7a46uvsw	cmoa7j076000n71fjntx79p2r	cmoa7j0b0000p71fjxqwe9rlq
cmo997lo900132qxqceh672kk	G-052574-1	178642-178647	INCIDENCIA	2026-04-21 23:27:32.985	2026-04-22 15:31:17.203	INCIDENCIA: CLIENTE_AUSENTE	07:30	10:28	18	No sé hace la entrega por falta de documentación	cmo98vegw000s2qxqdakxqgzr	cmo997lgn000z2qxqv69kofuu	cmo997lkf00112qxqbr8aoccv
cmo98sbeq000i2qxqev59ne86	G-339312-2	86428	ENTREGADO	2026-04-21 23:15:39.842	2026-04-22 15:31:35.826	Fernando Salvador	10:20	10:30	18	\N	cmo98ltuk00032qxq4jbzbg3t	cmo98sb1t000a2qxqmnncmvfy	cmo98sbcx000g2qxqh2mul4jj
cmo98sb96000e2qxqtr0xpsxz	G-339312-1	86424	ENTREGADO	2026-04-21 23:15:39.642	2026-04-22 16:28:05.867	Camila topon	11:10	11:27	3.8	\N	cmo98ihx600012qxq3f43igdj	cmo98sb1t000a2qxqmnncmvfy	cmo98sb5i000c2qxqgx4iqgh9
cmo997ltx00172qxq3ywzuf0b	G-052574-2	86429	ENTREGADO	2026-04-21 23:27:33.19	2026-04-22 17:10:18.314	Juan gallegos	12:00	12:09	5.9	\N	cmo991bma000u2qxq1xifmy1n	cmo997lgn000z2qxqv69kofuu	cmo997ls100152qxqaq7x0acb
cmo997lxq001b2qxq1682lvy1	G-052574-3	86430-178623	INCIDENCIA	2026-04-21 23:27:33.327	2026-04-22 18:29:25.798	INCIDENCIA: CLIENTE_AUSENTE	13:00	13:27	5	No reciben toxó IGM y rub igg por fecha corta	cmo994ycg000w2qxqo3pxauzx	cmo997lgn000z2qxqv69kofuu	cmo997lvu00192qxquyvslm1d
cmoagxwbv0006ofo6pqw8br0m	NUEVA GUIA	Insumos 	PENDIENTE	2026-04-22 19:51:43.34	2026-04-22 19:51:43.34	\N	\N	\N	\N	\N	cmo991bma000u2qxq1xifmy1n	cmoagxw020002ofo6r5si1g9d	cmoagxw430004ofo602ko8spv
\.


--
-- Data for Name: Novedad; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Novedad" (id, tipo, descripcion, "createdAt", "guiaId") FROM stdin;
cmoa7mzbf000t71fjk7wn2cp6	CLIENTE_AUSENTE	No sé hace la entrega por falta de documentación	2026-04-22 15:31:17.452	cmo997lo900132qxqceh672kk
cmoae02ow0001a88z3fp3yjb9	CLIENTE_AUSENTE	No reciben toxó IGM y rub igg por fecha corta	2026-04-22 18:29:26.048	cmo997lxq001b2qxq1682lvy1
\.


--
-- Data for Name: Ruta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ruta" (id, fecha, estado, "createdAt", "updatedAt", "choferId", "seguimientoChofer", nombre) FROM stdin;
cmo8n86a5000e8p6h9cp3qirb	2026-04-21	COMPLETADA	2026-04-21 13:12:08.141	2026-04-21 15:23:48.682	cmo3c6e3r00001r2zb5csxlno	NINGUNO	\N
cmo8z87a100146xmz9gmz40qy	2026-04-21	COMPLETADA	2026-04-21 18:48:04.825	2026-04-21 18:48:53.356	cmo8pw0u1000311kgtyei796k	NINGUNO	\N
cmo8xb1ta000r6xmzr433myct	2026-04-21	COMPLETADA	2026-04-21 17:54:18.478	2026-04-21 19:00:19.169	cmo8wv7kf000k6xmzsgygq2ft	NINGUNO	\N
cmo8zenya001i6xmzrq85ktbp	2026-04-21	COMPLETADA	2026-04-21 18:53:06.371	2026-04-21 19:02:16.189	cmo8pw0u1000311kgtyei796k	NINGUNO	\N
cmoa7j076000n71fjntx79p2r	2026-04-22	PENDIENTE	2026-04-22 15:28:11.97	2026-04-22 15:28:11.97	cmo8pw0u1000311kgtyei796k	NINGUNO	\N
cmo98sb1t000a2qxqmnncmvfy	2026-04-22	COMPLETADA	2026-04-21 23:15:39.378	2026-04-22 16:28:50.563	cmo3c6e3r00001r2zb5csxlno	NINGUNO	\N
cmo997lgn000z2qxqv69kofuu	2026-04-22	COMPLETADA	2026-04-21 23:27:32.711	2026-04-22 18:31:27.687	cmo8wv7kf000k6xmzsgygq2ft	NINGUNO	\N
cmoagxw020002ofo6r5si1g9d	2026-04-22	PENDIENTE	2026-04-22 19:51:42.914	2026-04-22 19:51:42.914	cmo302pse0001utu80pbodneo	NINGUNO	RUTA 1
\.


--
-- Data for Name: SeguimientoNovedad; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SeguimientoNovedad" (id, nota, "createdAt", "novedadId") FROM stdin;
\.


--
-- Data for Name: Stop; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Stop" (id, orden, direccion, lat, lng, notas, "createdAt", "rutaId", "clienteId") FROM stdin;
cmo8n86e3000g8p6hd6hsv12a	1	Portoviejo, Quito - Pichincha, 1704, Ecuador	-0.2057244236845293	-78.505043048305	\N	2026-04-21 13:12:08.283	cmo8n86a5000e8p6h9cp3qirb	cmo8n45il00018p6hu8sgxclv
cmo8n86ly000k8p6hvf3y1mdz	2	Avenida Río Amazonas, Quito - Pichincha, 1705, Ecuador	-0.1751641364494674	-78.48507571546892	\N	2026-04-21 13:12:08.566	cmo8n86a5000e8p6h9cp3qirb	cmo8n5igp00038p6how6mmi4l
cmo8xb1x3000t6xmzbzs357n8	1	Alemania, Quito - Pichincha, 1705, Ecuador	-0.1929092662129221	-78.4917857071516	\N	2026-04-21 17:54:18.615	cmo8xb1ta000r6xmzr433myct	cmo8x5wgi000m6xmziol9i82s
cmo8xb24p000x6xmz668el73z	2	Avenida Florencia, Quito - Pichincha, 1709, Ecuador	-0.2087685217800868	-78.42407682931146	\N	2026-04-21 17:54:18.889	cmo8xb1ta000r6xmzr433myct	cmo8x7fip000o6xmzbsu3aqgs
cmo8z87dv00166xmz6im2wxc8	1	Avenida Florencia, Quito - Pichincha, 1709, Ecuador	-0.2087685217800868	-78.42407682931146	Prueba	2026-04-21 18:48:04.964	cmo8z87a100146xmz9gmz40qy	cmo8x7fip000o6xmzbsu3aqgs
cmo8zeo25001k6xmznklbleuy	1	Japón, Quito - Pichincha, 1705, Ecuador	-0.1791416973296123	-78.4849345397949	\N	2026-04-21 18:53:06.51	cmo8zenya001i6xmzrq85ktbp	cmo8zbs8q001d6xmz7a46uvsw
cmo98sb5i000c2qxqgx4iqgh9	1	Diego de Robles, Quito - Pichincha, 1709, Ecuador	-0.1970303794433761	-78.43677799081291	\N	2026-04-21 23:15:39.51	cmo98sb1t000a2qxqmnncmvfy	cmo98ihx600012qxq3f43igdj
cmo98sbcx000g2qxqh2mul4jj	2	Isla Seymour, Quito - Pichincha, 1705, Ecuador	-0.1570156331295749	-78.48046140425735	\N	2026-04-21 23:15:39.778	cmo98sb1t000a2qxqmnncmvfy	cmo98ltuk00032qxq4jbzbg3t
cmo98sbgj000k2qxqupxjy86j	3	Avenida Río Amazonas, Quito - Pichincha, 1705, Ecuador	-0.1535677511990485	-78.48817491001148	\N	2026-04-21 23:15:39.908	cmo98sb1t000a2qxqmnncmvfy	cmo98ncdd00052qxq23xn7p1m
cmo98sbk6000o2qxq1yoh4g9m	4	De las Avigiras, Quito - Pichincha, 1705, Ecuador	-0.1377107503549979	-78.46909037030352	\N	2026-04-21 23:15:40.038	cmo98sb1t000a2qxqmnncmvfy	cmo98ovy600072qxqucimfk74
cmo997lkf00112qxqbr8aoccv	1	Olmedo, Riobamba - Chimborazo, 0601, Ecuador	-1.680541553210603	-78.64348312190234	\N	2026-04-21 23:27:32.848	cmo997lgn000z2qxqv69kofuu	cmo98vegw000s2qxqdakxqgzr
cmo997ls100152qxqaq7x0acb	2	Avenida González Suárez, Ambato - Provincia de Tungurahua, 1801, Ecuador	-1.235089372149744	-78.6189026999635	\N	2026-04-21 23:27:33.121	cmo997lgn000z2qxqv69kofuu	cmo991bma000u2qxq1xifmy1n
cmo997lvu00192qxquyvslm1d	3	Laguna Colta, Latacunga - Cotopaxi, 0501, Ecuador	-0.9305807150941376	-78.60301528058251	\N	2026-04-21 23:27:33.258	cmo997lgn000z2qxqv69kofuu	cmo994ycg000w2qxqo3pxauzx
cmoa7j0b0000p71fjxqwe9rlq	1	Baron Carondelet, Quito - Pichincha, 1705, Ecuador	-0.1710736502988937	-78.4928309631351	\N	2026-04-22 15:28:12.109	cmoa7j076000n71fjntx79p2r	cmo8zbs8q001d6xmz7a46uvsw
cmoagxw430004ofo602ko8spv	1	Avenida González Suárez, Ambato - Provincia de Tungurahua, 1801, Ecuador	-1.235089372149744	-78.6189026999635	\N	2026-04-22 19:51:43.06	cmoagxw020002ofo6r5si1g9d	cmo991bma000u2qxq1xifmy1n
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Usuario" (id, nombre, cedula, email, password, rol, activo, "createdAt", "updatedAt", "clienteId", "mustChangePassword", "activeSessionToken", "resetToken", "resetTokenExpiry", celular) FROM stdin;
cmo302pse0001utu80pbodneo	Carlos Pérez	1712345678	chofer@medlogix.ec	$2b$10$5SZmCk.hmCe1EC2.CuTl8.jZAqL4oZT2/Xjh4uazVuB/he5mcJEVq	CHOFER	t	2026-04-17 14:25:11.438	2026-04-20 14:39:05.202	\N	f	c36bf4a257e709b8ebc9817da226642af6e67da801191819911d2d32e78f541f	\N	\N	0987654321
cmo8pw0u1000311kgtyei796k	Prueba Chofer	1714255869	pruebachofer@gmail.com	$2b$10$htjbzXBTCwNiU9ihlvZrNOU1qq6QiVOlkzUYoBZSFjoDll1354lnC	CHOFER	t	2026-04-21 14:26:40.057	2026-04-22 13:52:08.15	\N	f	43d85f8deacfd799315e7cd4651f2e587b339e0191916f224162c728e9f9760b	\N	\N	0968573241
cmoa6dpyt000271fj7547438m	prueba	\N	kevin@gmail.com	$2b$10$dHrnAp7/Vv/OCfye28BHoe5Zw.5Lo6n60YbKfYnzaTNjzEyWfoiOe	CLIENTE	t	2026-04-22 14:56:05.814	2026-04-22 14:56:57.855	cmoa6do7i000071fjkbnskj2k	f	fb8fbb7ae6548912b60584f1b219a1b3dd0178569f7e1fc7fd381bd6c8e2ccd8	\N	\N	\N
cmo8zbtrx001f6xmzsyp91j16	prueba	\N	prueba@email.com	$2b$10$ih.TSHDUPmwWu2CvF6yOpuw6zGQoiaDnxiC/JgMLxIjtgoaprIrlW	CLIENTE	t	2026-04-21 18:50:53.95	2026-04-22 15:26:00.813	cmo8zbs8q001d6xmz7a46uvsw	f	b3d951e1c4e819094a363deefeb8b7ba82b23145a4cac539712d397d108882b5	\N	\N	\N
cmo302oun0000utu830nhamcm	Administrador	\N	admin@medlogix.ec	$2b$10$CRtHphV5ROCy2mRubTBA0OB50Z8pmi4sPPsQ9.V5W4lVvWXyp384O	ADMIN	t	2026-04-17 14:25:10.223	2026-04-22 16:31:02.839	\N	f	5526c9766147e90a9e3f98aa48bd8291911bde6b1ff05075aa9218d5811674c0	\N	\N	0999999999
cmo8wv7kf000k6xmzsgygq2ft	Alex Aguilar	1727078998	barragandayanna45@gmail.com	$2b$10$8W.HP0D9k0shOq7yP4Rzt.6DrpWVS/bTl3baE4OirEybZbkhNnLpS	CHOFER	t	2026-04-21 17:41:59.44	2026-04-22 17:08:49.351	\N	f	5b3ca92057a4383adaa495561a544686909d6f8d78ef6d2cbb47232d83405ef3	\N	\N	0999102803
cmo3323b700005ukp6pxmrdch	Raul	1728391425	raul@gmail.com	$2b$10$k94KSQIcL.LX/55pwpt/4e6ZsaFVJvmbftJUoYUyJxWh63g9dl6yW	ADMIN	t	2026-04-17 15:48:41.155	2026-04-21 15:40:14.356	\N	f	d009f7e412cdcf55f2890f92fe7818dc626348719550a17262ad864354929c90	\N	\N	0741852963
cmo335ns200025ukpjjgshtji	cimed	\N	logistica@cimed.ec	$2b$10$Xeo0JDbl5cr2hMMLuBQ4n.j9lgr.mjQm92.cRZ.w7nse8tErXTcve	CLIENTE	t	2026-04-17 15:51:27.65	2026-04-22 20:24:53.091	cmo302q8n0002utu86a9f4b4i	f	70074300eec96f9fc9f9416f33824d9a161fb49f5adfea1bea968a03bbf2e434	\N	\N	\N
cmo3c6e3r00001r2zb5csxlno	Fernando Barragán 	1723743652	fbarragan229@gmail.com	$2b$10$KrRtD9x9dHfYeTEMk1PmSOvnEvacJnEReIVyirXTg6DO/Sz5OEL8e	CHOFER	t	2026-04-17 20:03:58.25	2026-04-26 20:02:10.887	\N	f	481dbecbe2cb6a075ef01fcca547b54f18ff2dc44144069ccef234f395a5e50d	\N	\N	0978884796
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4826a32c-c1ed-44aa-9d7a-422462b45a65	86e8a7956e3e52b09afc01973e500c3b8f8af2f1ae308ea89b4911e0a1280655	2026-04-17 14:24:21.391513+00	20260406170926_init	\N	\N	2026-04-17 14:24:20.856665+00	1
0fff3033-2ddf-491c-a57f-404af212e55a	e5f3ef2e6da91a754bd31a585c4368698a075eddcf9b83731e752a7c39f6ccf2	2026-04-17 14:24:22.059548+00	20260406195328_add_must_change_password	\N	\N	2026-04-17 14:24:21.583085+00	1
4ed6f962-6cb5-4527-9e53-efda7a95fa42	a734bb401a48953bd452ca25f5403f2c9e7fbf17a6187ae3f6439fbdbb3c03f5	2026-04-17 14:24:22.732018+00	20260407133958_add_tipo_cliente_jerarquia	\N	\N	2026-04-17 14:24:22.250565+00	1
1f9ba070-6344-42f6-873b-b88a7b1654fb	47657c0a11e3909bcd58bf5c3e433926abb31723f011776dc82e322bd483f67c	2026-04-17 14:24:23.416599+00	20260408140000_add_seguimiento_chofer	\N	\N	2026-04-17 14:24:22.923557+00	1
d21388c0-a74b-4522-ab26-341da337f3bb	c099aeb5408486e1d009452de0edd0608db8831bcd29d33a6170560c252ab5ef	2026-04-17 14:24:24.090419+00	20260409220000_add_lat_lng_to_cliente	\N	\N	2026-04-17 14:24:23.608516+00	1
ba925286-b737-4ce0-a6d8-1de8ebc1f39b	9bc4f17ff7ba91d2c0dfaf9eaf55ac7c1dd9546f46ca7431f9f8fbe39bbbf951	2026-04-17 14:24:24.767374+00	20260414185850_add_active_session_token	\N	\N	2026-04-17 14:24:24.281929+00	1
cb1bd620-60a5-4fc5-8912-5817c2850475	16ae0d3bed465131757668fee58334f86730668f37b1ddae3779d3019c223c74	2026-04-17 14:24:25.448935+00	20260417141212_add_telefono_to_usuario	\N	\N	2026-04-17 14:24:24.957371+00	1
31fd313b-743e-4f82-baff-cbe320a2d013	27cc1642efe5bfcf94244e580a2e7bf7d2e6051502fff39e2158eb665732e778	2026-04-17 14:24:26.122184+00	20260417142112_make_celular_required	\N	\N	2026-04-17 14:24:25.640382+00	1
38746f3d-aedd-486e-971b-acfcb3e4d024	3672d0c17045867672914c42ec5b689846da1ec01124c9cb6fbaaf679618bffe	2026-04-17 14:34:05.28804+00	20260417143404_remove_telefono_field	\N	\N	2026-04-17 14:34:04.733092+00	1
58696c9d-5a98-41f6-811f-d04ff1df9b12	60d90ceb918456bd0c8df65a41fb710112240a5e328bfccbe4cea6b7c58b27f3	2026-04-17 15:23:45.168875+00	20260417152344_make_celular_optional	\N	\N	2026-04-17 15:23:44.691312+00	1
dfd23a0e-7bed-4171-82a4-f1a4054cbc09	2a346341c1bb1f048401fbf55bf6c9b9e0bb6e78abf1fab59d435e468cda9d1d	2026-04-22 13:45:37.197777+00	20260422134536_add_nombre_to_ruta	\N	\N	2026-04-22 13:45:36.67031+00	1
022002a8-5d78-490a-9732-4f7b8dce53a6	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2026-04-22 13:48:34.753266+00	20260422134748_add_nombre_to_ruta	\N	\N	2026-04-22 13:48:34.135643+00	1
\.


--
-- Data for Name: ruta_seguimiento_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ruta_seguimiento_logs (id, ruta_id, chofer_id, seguimiento_chofer, created_at) FROM stdin;
c9fc1ab2-9e84-4cc7-94ba-c452fc68bc87	cmo8n86a5000e8p6h9cp3qirb	cmo3c6e3r00001r2zb5csxlno	EN_CAMINO	2026-04-21 13:26:14.376106+00
\.


--
-- Name: Cliente Cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY (id);


--
-- Name: Foto Foto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Foto"
    ADD CONSTRAINT "Foto_pkey" PRIMARY KEY (id);


--
-- Name: GuiaEntrega GuiaEntrega_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuiaEntrega"
    ADD CONSTRAINT "GuiaEntrega_pkey" PRIMARY KEY (id);


--
-- Name: Novedad Novedad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Novedad"
    ADD CONSTRAINT "Novedad_pkey" PRIMARY KEY (id);


--
-- Name: Ruta Ruta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ruta"
    ADD CONSTRAINT "Ruta_pkey" PRIMARY KEY (id);


--
-- Name: SeguimientoNovedad SeguimientoNovedad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeguimientoNovedad"
    ADD CONSTRAINT "SeguimientoNovedad_pkey" PRIMARY KEY (id);


--
-- Name: Stop Stop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Stop"
    ADD CONSTRAINT "Stop_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ruta_seguimiento_logs ruta_seguimiento_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ruta_seguimiento_logs
    ADD CONSTRAINT ruta_seguimiento_logs_pkey PRIMARY KEY (id);


--
-- Name: Cliente_ruc_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Cliente_ruc_key" ON public."Cliente" USING btree (ruc);


--
-- Name: GuiaEntrega_numeroGuia_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GuiaEntrega_numeroGuia_key" ON public."GuiaEntrega" USING btree ("numeroGuia");


--
-- Name: Usuario_activeSessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_activeSessionToken_key" ON public."Usuario" USING btree ("activeSessionToken");


--
-- Name: Usuario_cedula_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_cedula_key" ON public."Usuario" USING btree (cedula);


--
-- Name: Usuario_celular_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_celular_key" ON public."Usuario" USING btree (celular);


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: Usuario_resetToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_resetToken_key" ON public."Usuario" USING btree ("resetToken");


--
-- Name: idx_ruta_seguimiento_logs_ruta_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ruta_seguimiento_logs_ruta_id_created_at ON public.ruta_seguimiento_logs USING btree (ruta_id, created_at DESC);


--
-- Name: Cliente Cliente_clientePrincipalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cliente"
    ADD CONSTRAINT "Cliente_clientePrincipalId_fkey" FOREIGN KEY ("clientePrincipalId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Foto Foto_guiaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Foto"
    ADD CONSTRAINT "Foto_guiaId_fkey" FOREIGN KEY ("guiaId") REFERENCES public."GuiaEntrega"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Foto Foto_rutaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Foto"
    ADD CONSTRAINT "Foto_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES public."Ruta"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuiaEntrega GuiaEntrega_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuiaEntrega"
    ADD CONSTRAINT "GuiaEntrega_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GuiaEntrega GuiaEntrega_rutaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuiaEntrega"
    ADD CONSTRAINT "GuiaEntrega_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES public."Ruta"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuiaEntrega GuiaEntrega_stopId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GuiaEntrega"
    ADD CONSTRAINT "GuiaEntrega_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES public."Stop"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Novedad Novedad_guiaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Novedad"
    ADD CONSTRAINT "Novedad_guiaId_fkey" FOREIGN KEY ("guiaId") REFERENCES public."GuiaEntrega"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ruta Ruta_choferId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ruta"
    ADD CONSTRAINT "Ruta_choferId_fkey" FOREIGN KEY ("choferId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SeguimientoNovedad SeguimientoNovedad_novedadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeguimientoNovedad"
    ADD CONSTRAINT "SeguimientoNovedad_novedadId_fkey" FOREIGN KEY ("novedadId") REFERENCES public."Novedad"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Stop Stop_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Stop"
    ADD CONSTRAINT "Stop_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Stop Stop_rutaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Stop"
    ADD CONSTRAINT "Stop_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES public."Ruta"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Usuario Usuario_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public."Cliente"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict c3mMbQvQH3dv6ydBcqoEzBwxKkHR2ozASlt3ejRseTqiStmNlUtfdh2JahpeQiD

