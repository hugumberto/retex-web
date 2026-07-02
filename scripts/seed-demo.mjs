// Popula dados de demonstração na API local para as evidências (screenshots).
// Uso: node scripts/seed-demo.mjs [apiUrl] [email] [password]
//   defaults: http://localhost:3000  admin@retex.pt  123456
// Idempotente: reutiliza por nome/slug/email; pacotes/itens só são criados se
// o dashboard ainda estiver "magro". Não toca em produção (aponta para local).

const API = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.argv[3] ?? 'admin@retex.pt';
const PASSWORD = process.argv[4] ?? '123456';

let token = '';

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status}`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

// Lista que pode vir como array puro ou paginado { data: [...] }.
async function list(path) {
  try {
    const r = await req('GET', path);
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.data)) return r.data;
    return [];
  } catch {
    return [];
  }
}

async function getOrCreate(listPath, createPath, body, matcher) {
  const existing = await list(listPath);
  const found = existing.find(matcher);
  if (found) return found;
  try {
    return await req('POST', createPath, body);
  } catch (e) {
    if (e.status === 409) {
      const again = await list(listPath);
      const f = again.find(matcher);
      if (f) return f;
    }
    throw e;
  }
}

const norm = (s) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

async function main() {
  // --- login ---
  const login = await req('POST', '/auth/login', {
    email: EMAIL,
    password: PASSWORD,
  });
  token = login.access_token;
  console.log(`✔ login como ${EMAIL}`);

  // --- zonas atendidas ---
  const servedCities = ['Lisboa', 'Porto', 'Braga'];
  for (const city of servedCities) {
    await getOrCreate('/zone', '/zone', { city }, (z) => norm(z.city) === norm(city));
  }
  console.log(`✔ zonas: ${servedCities.join(', ')}`);

  // --- marcas ---
  const brandNames = ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi’s'];
  const brands = [];
  for (const name of brandNames) {
    brands.push(
      await getOrCreate('/brand', '/brand', { name }, (b) => norm(b.name) === norm(name)),
    );
  }
  console.log(`✔ marcas: ${brands.length}`);

  // --- categorias de blog ---
  const catNames = ['Moda Circular', 'Sustentabilidade'];
  const blogCats = [];
  for (const title of catNames) {
    blogCats.push(
      await getOrCreate(
        '/blog-category',
        '/blog-category',
        { title, status: 'ACTIVE' },
        (c) => norm(c.title) === norm(title),
      ),
    );
  }
  console.log(`✔ categorias de blog: ${blogCats.length}`);

  // --- posts de blog (criar + publicar) ---
  const posts = [
    {
      slug: 'o-que-e-moda-circular',
      title: 'O que é moda circular?',
      body: 'A moda circular procura manter o têxtil em uso o máximo de tempo possível, através de reutilização, reparo e reciclagem. Na Retex recolhemos, triamos e valorizamos roupa em fim de uso.',
    },
    {
      slug: 'como-preparar-a-sua-roupa-para-recolha',
      title: 'Como preparar a sua roupa para recolha',
      body: 'Separe as peças por estado, coloque-as num saco fechado e agende a recolha pelo portal. Roupa limpa e seca acelera a triagem e melhora a valorização.',
    },
    {
      slug: 'impacto-ambiental-da-reutilizacao-textil',
      title: 'Impacto ambiental da reutilização têxtil',
      body: 'Cada quilo de têxtil reutilizado evita emissões de CO₂ e poupa milhares de litros de água face à produção de peças novas.',
    },
  ];
  let firstSlug = null;
  let firstPostId = null;
  for (const [i, p] of posts.entries()) {
    const existing = (await list('/blog-post')).find((x) => x.slug === p.slug);
    let post = existing;
    if (!post) {
      post = await req('POST', '/blog-post', {
        slug: p.slug,
        title: p.title,
        body: p.body,
        hero: 'https://images.unsplash.com/photo-1489987707025-afc232f7',
        highlight: i === 0 ? 1 : 0,
        tags: ['retex', 'circular'],
        categoryIds: blogCats[i % blogCats.length] ? [blogCats[i % blogCats.length].id] : [],
      });
    }
    // publicar (idempotente; ignora erro se já publicado)
    try {
      await req('PUT', `/blog-post/${post.id}/publish`);
    } catch {
      /* já publicado */
    }
    if (i === 0) {
      firstSlug = post.slug;
      firstPostId = post.id;
    }
  }
  console.log(`✔ posts de blog: ${posts.length} (publicados)`);

  // --- FAQ ---
  const faqDefs = [
    {
      title: 'Geral',
      description: 'Perguntas frequentes sobre a Retex',
      items: [
        ['O que é a Retex?', 'Uma plataforma de economia circular têxtil.'],
        ['Quanto custa?', 'A recolha de roupa usada é gratuita.'],
      ],
    },
    {
      title: 'Recolha',
      description: 'Como funciona a recolha',
      items: [
        ['Como agendo uma recolha?', 'Através do portal, na área de solicitações.'],
        ['Que peças são aceites?', 'Roupa, calçado e têxteis-lar em qualquer estado.'],
      ],
    },
  ];
  for (const f of faqDefs) {
    const cat = await getOrCreate(
      '/faq/all',
      '/faq/category',
      { title: f.title, description: f.description, status: 'ACTIVE' },
      (c) => norm(c.title) === norm(f.title),
    );
    const existingItems = cat.items ?? cat.faqItems ?? [];
    for (const [title, description] of f.items) {
      if (existingItems.find((it) => norm(it.title) === norm(title))) continue;
      try {
        await req('POST', `/faq/category/${cat.id}/item`, { title, description });
      } catch {
        /* tolera */
      }
    }
  }
  console.log(`✔ FAQ: ${faqDefs.length} categorias`);

  // --- storage units ---
  const existingSU = await list('/storage-unit');
  if (existingSU.length < 6) {
    const quals = ['GOOD', 'MEDIUM', 'BAD'];
    for (let i = 0; i < 6; i++) {
      const brand = brands[i % brands.length];
      try {
        await req('POST', '/storage-unit', {
          brandId: brand.id,
          quality: quals[i % quals.length],
        });
      } catch {
        /* tolera */
      }
    }
  }
  console.log('✔ storage units');

  // --- utilizadores ---
  const userDefs = [
    { firstName: 'Ana', lastName: 'Silva', email: 'ana.silva@demo.retex.pt', userType: 'PERSON', roles: null },
    { firstName: 'Bruno', lastName: 'Costa', email: 'bruno.costa@demo.retex.pt', userType: 'PERSON', roles: null },
    { firstName: 'Carla', lastName: 'Dias', email: 'carla.dias@demo.retex.pt', userType: 'PERSON', roles: ['OPS'] },
    { firstName: 'Diogo', lastName: 'Matos', email: 'diogo.matos@demo.retex.pt', userType: 'PERSON', roles: ['DRIVER'] },
    { firstName: 'Recolhe', lastName: 'Lda', email: 'empresa.recolhe@demo.retex.pt', userType: 'COMPANY', roles: null },
  ];
  const users = [];
  for (const u of userDefs) {
    let user = (await list('/user')).find((x) => norm(x.email) === norm(u.email));
    if (!user) {
      user = await req('POST', '/user', {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        contactPhone: '912345678',
        password: 'demo12345',
        userType: u.userType,
      });
    }
    if (u.roles) {
      try {
        await req('POST', `/user/${user.id}/roles`, { roles: ['USER', ...u.roles] });
      } catch {
        /* tolera */
      }
    }
    users.push(user);
  }
  console.log(`✔ utilizadores: ${users.length}`);

  // --- pacotes + itens (só se o dashboard estiver magro) ---
  const stats = await req('GET', '/dashboard/stats').catch(() => null);
  const needPackages =
    !stats ||
    stats.triage.totalItems < 10 ||
    Number(stats.packages.totalWeightKg) <= 0 ||
    stats.outOfZone.totalPackages < 2;

  if (needPackages) {
    const mkAddress = async (userId, city, served) =>
      req('POST', `/user/${userId}/address`, {
        userId,
        street: served ? 'Rua das Flores' : 'Rua Nova',
        number: String(10 + Math.floor(city.length)),
        city,
        cityDivision: city,
        country: 'Portugal',
        countryDivision: city,
        zipCode: '1000-001',
        lat: '38.72',
        long: '-9.14',
        isDefault: true,
      });

    const mkPackage = (userId, addressId) =>
      req('POST', '/package', { userId, addressId, estimatedVolumes: 1 + (addressId.length % 4) });

    // Pacotes em cidade atendida -> CREATED; depois variamos status + peso.
    const statuses = [
      'WAITING_FOR_COLLECTION',
      'COLLECTED',
      'IN_TRANSIT',
      'SCREENING',
      'STOCKED',
      'IN_HOUSE',
    ];
    const servedPackages = [];
    let si = 0;
    for (const user of users) {
      const city = ['Lisboa', 'Porto', 'Braga'][si % 3];
      const addr = await mkAddress(user.id, city, true).catch(() => null);
      if (!addr) continue;
      const pkg = await mkPackage(user.id, addr.id).catch(() => null);
      if (!pkg) continue;
      // metade fica CREATED, a outra metade recebe status/peso variados
      if (si % 2 === 1) {
        const status = statuses[si % statuses.length];
        await req('PATCH', `/package/${pkg.id}`, {
          status,
          weight: 5 + si * 2,
        }).catch(() => {});
      } else {
        await req('PATCH', `/package/${pkg.id}`, { weight: 4 + si }).catch(() => {});
      }
      servedPackages.push(pkg);
      si++;
    }

    // Pacotes fora de zona (cidades não atendidas) -> OUT_OF_ZONE automático.
    const outCities = ['Coimbra', 'Faro', 'Aveiro', 'Coimbra'];
    for (let i = 0; i < outCities.length; i++) {
      const user = users[i % users.length];
      const addr = await mkAddress(user.id, outCities[i], false).catch(() => null);
      if (!addr) continue;
      await mkPackage(user.id, addr.id).catch(() => null);
    }

    // Itens de triagem nos pacotes atendidos.
    const quals = ['GOOD', 'MEDIUM', 'BAD'];
    const types = ['UPPER_PART', 'UNDER_PART'];
    const seasons = ['SUMMER', 'WINTER'];
    let made = 0;
    for (const pkg of servedPackages) {
      const n = 2 + (made % 3);
      for (let k = 0; k < n; k++) {
        await req('POST', '/items', {
          packageId: pkg.id,
          quality: quals[(made + k) % quals.length],
          type: types[(made + k) % types.length],
          season: seasons[(made + k) % seasons.length],
          brandId: brands[(made + k) % brands.length].id,
          quantity: 1 + ((made + k) % 5),
        }).catch(() => {});
        made++;
      }
    }
    console.log(`✔ pacotes atendidos: ${servedPackages.length}, fora de zona: ${outCities.length}, itens: ${made}`);
  } else {
    console.log('• dashboard já populado — pulei pacotes/itens');
  }

  const finalStats = await req('GET', '/dashboard/stats').catch(() => null);
  console.log('\n=== RESUMO DASHBOARD ===');
  if (finalStats) {
    console.log(JSON.stringify(finalStats, null, 2));
  }
  console.log('\n=== ROTAS DINÂMICAS PARA SCREENSHOTS ===');
  console.log(`BLOG_SLUG=${firstSlug ?? ''}`);
  console.log(`BLOG_POST_ID=${firstPostId ?? ''}`);
}

main().catch((e) => {
  console.error('ERRO seed:', e.message, e.payload ?? '');
  process.exit(1);
});
