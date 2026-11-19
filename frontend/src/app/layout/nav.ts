export interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly path: string;
}

/** Itens do menu, conforme o protótipo (docs/legacy/index.html). */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Painel', icon: 'dashboard', path: '/painel' },
  { label: 'Vendas', icon: 'shopping_cart', path: '/vendas' },
  { label: 'Produção', icon: 'bakery_dining', path: '/producao' },
  { label: 'Estoque', icon: 'inventory_2', path: '/estoque' },
  { label: 'Financeiro', icon: 'payments', path: '/financeiro' },
  { label: 'Configurações', icon: 'settings', path: '/configuracoes' },
];
