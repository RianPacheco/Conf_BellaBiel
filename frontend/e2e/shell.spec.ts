import { expect, test } from '@playwright/test';

const ITENS = ['Painel', 'Vendas', 'Produção', 'Estoque', 'Financeiro', 'Configurações'];

test('não faz nenhuma requisição externa (fontes e ícones são locais)', async ({ page }) => {
  const externas: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!['localhost', ''].includes(url.hostname) && url.protocol.startsWith('http')) {
      externas.push(req.url());
    }
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(externas).toEqual([]);
});

test('ícones Material Symbols renderizam como glifo (ligatura do subset funciona)', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const icone = page.locator('.material-symbols-outlined', { hasText: 'notifications' }).first();
  const largura = await icone.evaluate((el) => el.getBoundingClientRect().width);
  // Sem a ligatura o texto "notifications" ocuparia >100px; com ela é ~24px.
  expect(largura).toBeLessThan(40);
  const carregada = await page.evaluate(() =>
    document.fonts.check('24px "Material Symbols Outlined"'),
  );
  expect(carregada).toBe(true);
});

test('sem rolagem horizontal em nenhuma seção', async ({ page }) => {
  for (const rota of [
    '/painel',
    '/vendas',
    '/producao',
    '/estoque',
    '/financeiro',
    '/configuracoes',
    '/privacidade',
  ]) {
    await page.goto(rota);
    const estoura = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(estoura, `rolagem horizontal em ${rota}`).toBe(false);
  }
});

test('navegação pelo menu muda de seção', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/painel$/);
  if (isMobile) await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page
    .getByRole('navigation', { name: 'Seções' })
    .getByRole('link', { name: /Estoque/ })
    .click();
  await expect(page).toHaveURL(/\/estoque$/);
  await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible();
});

test.describe('desktop', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop'));

  test('sidebar fixa com todos os itens e sem botão de menu', async ({ page }) => {
    await page.goto('/painel');
    const nav = page.getByRole('navigation', { name: 'Seções' });
    for (const item of ITENS) await expect(nav.getByRole('link', { name: item })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeHidden();
    await expect(nav.getByRole('link', { name: /Painel/ })).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('mobile', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile'));

  test('menu recolhível: abre, fecha com Esc e com o fundo, e fecha ao navegar', async ({
    page,
  }) => {
    await page.goto('/painel');
    const aside = page.locator('#menu-lateral');
    const abrir = page.getByRole('button', { name: 'Abrir menu' });

    await expect(aside).toHaveAttribute('inert', '');
    await abrir.click();
    await expect(abrir).toHaveAttribute('aria-expanded', 'true');
    await expect(aside).not.toHaveAttribute('inert', '');
    await expect(aside.getByRole('link', { name: /Painel/ })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(aside).toHaveAttribute('inert', '');

    await abrir.click();
    await page.getByTestId('menu-fundo').click({ position: { x: 350, y: 400 } });
    await expect(aside).toHaveAttribute('inert', '');

    await abrir.click();
    await aside.getByRole('link', { name: /Financeiro/ }).click();
    await expect(page).toHaveURL(/\/financeiro$/);
    await expect(aside).toHaveAttribute('inert', '');
  });

  test('busca vira ícone expansível', async ({ page }) => {
    await page.goto('/painel');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByPlaceholder('Buscar...')).toBeVisible();
  });
});
