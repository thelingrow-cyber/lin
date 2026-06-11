/**
 * Lingrow Design System — fonte única da verdade.
 *
 * Toda cor, espaçamento, raio e sombra do app sai daqui. Nenhuma tela deve
 * declarar hex solto: importe `colors` e use os tokens. Trocar a identidade
 * visual do app inteiro = mudar este arquivo.
 *
 * Doc completa em DESIGN.md.
 */

export const colors = {
  // ── Marca — roxo refinado (não é o roxo-padrão do Tailwind) ──
  primary: '#6D28D9',
  primaryDark: '#5B21B6',
  primaryLight: '#8B5CF6',
  primarySoft: '#F3F0FF', // fundo roxo bem claro (badges, item selecionado)

  // ── Cores de apoio ──
  accent: '#F59E0B', // âmbar — streak, "fácil", energia
  accentSoft: '#FEF3C7',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  successDark: '#14532D',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#2563EB',
  infoSoft: '#DBEAFE',

  // ── Neutros QUENTES (família stone) ──
  // O segredo anti-"cara de IA": cinzas com leve calor no lugar dos
  // cinzas azulados (gray) que toda ferramenta de IA gera por padrão.
  text: '#1C1917', // títulos e texto principal
  textMuted: '#78716C', // texto secundário
  textFaint: '#A8A29E', // placeholders, legendas fracas
  border: '#E7E5E4',
  borderSoft: '#F1EFEE',

  // ── Superfícies ──
  bg: '#FAF9F7', // fundo de tela (off-white quente)
  surface: '#FFFFFF', // cards e texto sobre roxo
  onPrimary: '#FFFFFF',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 50,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const shadow = {
  // Sombra de card: suave, difusa, sem o "preto duro" do padrão.
  card: {
    shadowColor: '#1C1917',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#1C1917',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

/**
 * Famílias da fonte de marca (Plus Jakarta Sans, carregada no _layout).
 * Com fontes customizadas o RN não sintetiza peso: use a família certa
 * no lugar de fontWeight.
 */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/**
 * Escala tipográfica. Pesos como const para evitar erro de tipo no RN.
 */
export const font = {
  display: 30,
  title: 22,
  heading: 18,
  body: 15,
  small: 13,
  tiny: 11,
  bold: '800' as const,
  semibold: '700' as const,
  medium: '600' as const,
} as const;
