import * as React from 'react';

/**
 * `true` quando o portal corre como PWA instalada ("modo app").
 *
 * Arranca a `false` de propósito, tal como `useIsMobile`: no servidor não há
 * `window`, e devolver `true` provocava um mismatch de hidratação. O botão da
 * câmara aparece depois da hidratação — é imperceptível e é correto.
 *
 * Em desenvolvimento devolve sempre `true`: sem isto a leitura por câmara era
 * intestável num browser normal, porque só existe depois de instalar a app.
 * Em produção há a válvula `?scanner=1` para o mesmo efeito, para se poder
 * validar numa preview sem instalar nada.
 */
export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      setIsStandalone(true);
      return undefined;
    }

    if (new URLSearchParams(window.location.search).has('scanner')) {
      setIsStandalone(true);
      return undefined;
    }

    // `standalone` cobre Android e desktop; `navigator.standalone` é a versão
    // do iOS, que nunca implementou a media query.
    const mql = window.matchMedia('(display-mode: standalone)');
    const read = () =>
      setIsStandalone(
        mql.matches ||
          (window.navigator as Navigator & { standalone?: boolean })
            .standalone === true
      );

    mql.addEventListener('change', read);
    read();
    return () => mql.removeEventListener('change', read);
  }, []);

  return isStandalone;
}
