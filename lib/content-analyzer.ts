import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ButtonContent {
  text: string;
  selector: string;
  html: string;
  url: string;
  type?: string;
  classes?: string[];
  href?: string;
}

export interface PixelTracking {
  type: 'facebook' | 'google' | 'tiktok' | 'pinterest' | 'linkedin' | 'other';
  code: string;
  selector: string;
  html: string;
  url: string;
  id?: string;
}

export interface ContentAnalysis {
  buttons: ButtonContent[];
  pixels: PixelTracking[];
  url: string;
}

export class ContentAnalyzer {
  static async analyzePage(url: string): Promise<ContentAnalysis> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        validateStatus: (status) => status < 400,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      const buttons = this.extractButtons($, url);
      const pixels = this.extractPixels($, url);

      return {
        buttons,
        pixels,
        url,
      };
    } catch (error: any) {
      throw new Error(`Erro ao analisar página: ${error.message}`);
    }
  }

  static extractButtons($: cheerio.CheerioAPI, url: string): ButtonContent[] {
    const buttons: ButtonContent[] = [];

    // Botões padrão <button>
    $('button').each((index, element) => {
      const $el = $(element);
      const text = $el.text().trim() || $el.find('span, a, div').first().text().trim();
      const html = $.html(element);
      const type = $el.attr('type') || 'button';
      const classes = $el.attr('class')?.split(' ').filter(c => c) || [];
      const selector = this.generateSelector($el);
      const href = $el.attr('onclick')?.match(/window\.location\s*=\s*['"]([^'"]+)['"]/)?.[1] || 
                   $el.closest('a').attr('href') || 
                   $el.attr('data-href') || 
                   undefined;

      if (text || html) {
        buttons.push({
          text: text || '(sem texto)',
          selector,
          html,
          url,
          type,
          classes,
          href,
        });
      }
    });

    // Links que parecem botões
    $('a[class*="button"], a[class*="btn"], a[role="button"]').each((index, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      const html = $.html(element);
      const classes = $el.attr('class')?.split(' ').filter(c => c) || [];
      const selector = this.generateSelector($el);
      const href = $el.attr('href') || undefined;

      if (text && !buttons.some(b => b.text === text && b.selector === selector)) {
        buttons.push({
          text,
          selector,
          html,
          url,
          type: 'link',
          classes,
          href,
        });
      }
    });

    // Inputs tipo submit/button
    $('input[type="submit"], input[type="button"]').each((index, element) => {
      const $el = $(element);
      const text = $el.attr('value') || $el.attr('placeholder') || '';
      const html = $.html(element);
      const type = $el.attr('type') || 'input';
      const classes = $el.attr('class')?.split(' ').filter(c => c) || [];
      const selector = this.generateSelector($el);
      const href = $el.attr('onclick')?.match(/window\.location\s*=\s*['"]([^'"]+)['"]/)?.[1] || 
                   $el.attr('data-href') || 
                   $el.closest('form')?.attr('action') ||
                   undefined;

      if (text) {
        buttons.push({
          text,
          selector,
          html,
          url,
          type,
          classes,
          href,
        });
      }
    });

    // Divs/Spans com classes de botão
    $('div[class*="button"], div[class*="btn"], span[class*="button"], span[class*="btn"]').each((index, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      const html = $.html(element);
      const classes = $el.attr('class')?.split(' ').filter(c => c) || [];
      const selector = this.generateSelector($el);
      // Tentar encontrar link dentro do elemento
      const href = $el.find('a').first().attr('href') || 
                   $el.attr('onclick')?.match(/window\.location\s*=\s*['"]([^'"]+)['"]/)?.[1] || 
                   $el.attr('data-href') || 
                   undefined;

      // Só adicionar se tiver texto e não for muito genérico
      if (text && text.length > 0 && text.length < 100 && 
          !buttons.some(b => b.text === text && b.selector === selector)) {
        buttons.push({
          text,
          selector,
          html,
          url,
          type: 'div/span',
          classes,
          href,
        });
      }
    });

    return buttons;
  }

  static extractPixels($: cheerio.CheerioAPI, url: string): PixelTracking[] {
    const pixels: PixelTracking[] = [];
    const processedSelectors = new Set<string>();
    const pixelIdsFound = new Set<string>();

    // Facebook Pixel - Scripts (código principal)
    $('script').each((index, element) => {
      const $el = $(element);
      const content = $el.html() || '';
      const scriptText = $el.text();
      const fullContent = content + scriptText;

      // Facebook Pixel - Verificação mais rigorosa
      const hasFbq = /fbq\s*\(/.test(fullContent);
      const hasFacebookNet = /connect\.facebook\.net.*fbevents\.js/.test(fullContent);
      const hasFacebookPixel = /Facebook\s*Pixel|Meta\s*Pixel/i.test(fullContent);
      const hasFbPixelId = /fbq\s*\(\s*['"]init['"]\s*,\s*['"]?(\d{15,16})['"]?/.test(fullContent);

      if ((hasFbq && hasFacebookNet) || (hasFbq && hasFbPixelId) || (hasFacebookPixel && hasFbPixelId)) {
        const pixelId = this.extractFacebookPixelId(fullContent);
        
        if (pixelId && !pixelIdsFound.has(pixelId)) {
          const selector = `script:nth-of-type(${index + 1})`;
          
          if (!processedSelectors.has(selector)) {
            // Buscar o noscript correspondente
            let noscriptHtml = '';
            const nextNoscript = $el.next('noscript');
            if (nextNoscript.length > 0 && nextNoscript.html()?.includes('facebook.com/tr')) {
              noscriptHtml = nextNoscript.html() || '';
            }
            
            // Combinar script + noscript se existir
            const fullPixelCode = content + (noscriptHtml ? '\n' + noscriptHtml : '');
            
            pixels.push({
              type: 'facebook',
              code: fullPixelCode || content || scriptText,
              selector,
              html: $.html(element) + (noscriptHtml ? '\n' + $.html(nextNoscript[0]) : ''),
              url,
              id: pixelId,
            });
            processedSelectors.add(selector);
            pixelIdsFound.add(pixelId);
          }
        }
      }

      // Google Analytics / Google Tag Manager - Verificação mais rigorosa
      const hasGtag = /gtag\s*\(/.test(fullContent);
      const hasGa = /ga\s*\(/.test(fullContent);
      const hasGoogleAnalytics = /google-analytics\.com\/ga\.js/.test(fullContent);
      const hasGTM = /googletagmanager\.com\/gtm\.js/.test(fullContent);
      const hasGtagConfig = /gtag\(['"]config['"]/.test(fullContent);

      if ((hasGtag || hasGa || hasGoogleAnalytics || hasGTM || hasGtagConfig) && 
          !hasFbq && !hasFacebookNet) {
        const pixelId = this.extractGooglePixelId(fullContent);
        const selector = `script:nth-of-type(${index + 1})`;
        
        if (!processedSelectors.has(selector)) {
          pixels.push({
            type: 'google',
            code: content || scriptText,
            selector,
            html: $.html(element),
            url,
            id: pixelId,
          });
          processedSelectors.add(selector);
        }
      }

      // TikTok Pixel - Verificação mais rigorosa
      const hasTikTok = /tiktok.*pixel/i.test(fullContent) || 
                       /analytics\.tiktok\.com/i.test(fullContent);
      if (hasTikTok && !hasFbq && !hasGtag) {
        const selector = `script:nth-of-type(${index + 1})`;
        if (!processedSelectors.has(selector)) {
          pixels.push({
            type: 'tiktok',
            code: content || scriptText,
            selector,
            html: $.html(element),
            url,
          });
          processedSelectors.add(selector);
        }
      }

      // Pinterest Pixel - Verificação mais rigorosa
      const hasPinterest = /pinterest.*tag/i.test(fullContent) || 
                          /pinimg\.com\/js\/pinit/i.test(fullContent);
      if (hasPinterest && !hasFbq && !hasGtag) {
        const selector = `script:nth-of-type(${index + 1})`;
        if (!processedSelectors.has(selector)) {
          pixels.push({
            type: 'pinterest',
            code: content || scriptText,
            selector,
            html: $.html(element),
            url,
          });
          processedSelectors.add(selector);
        }
      }

      // LinkedIn Insight Tag - Verificação mais rigorosa
      const hasLinkedIn = /linkedin.*insight/i.test(fullContent) || 
                         /snap\.licdn\.com/i.test(fullContent);
      if (hasLinkedIn && !hasFbq && !hasGtag) {
        const selector = `script:nth-of-type(${index + 1})`;
        if (!processedSelectors.has(selector)) {
          pixels.push({
            type: 'linkedin',
            code: content || scriptText,
            selector,
            html: $.html(element),
            url,
          });
          processedSelectors.add(selector);
        }
      }
    });

    // Facebook Pixel - Meta tags (verificação mais rigorosa)
    $('meta').each((index, element) => {
      const $el = $(element);
      const property = $el.attr('property') || '';
      const name = $el.attr('name') || '';
      const content = $el.attr('content') || '';

      // Verificar se é realmente um pixel do Facebook
      const isFbPixel = (
        (property.includes('fb:app_id') || property.includes('fb:admins')) ||
        (name.includes('facebook') && /^\d{15,16}$/.test(content)) ||
        (property.includes('og:') && content.includes('facebook'))
      );

      // Verificar se tem ID de pixel válido
      const hasPixelId = /^\d{15,16}$/.test(content) || 
                        /facebook\.com\/tr\?id=(\d{15,16})/.test(content);

      if (isFbPixel && hasPixelId) {
        const pixelId = content.match(/\d{15,16}/)?.[0] || 
                       content.match(/id=(\d{15,16})/)?.[1];
        const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
        
        if (!processedSelectors.has(selector)) {
          pixels.push({
            type: 'facebook',
            code: content,
            selector,
            html: $.html(element),
            url,
            id: pixelId,
          });
          processedSelectors.add(selector);
        }
      }
    });

    // Noscript tags (fallback de pixels) - Só adicionar se não foi processado com o script
    $('noscript').each((index, element) => {
      const $el = $(element);
      const content = $el.html() || '';
      
      // Facebook Pixel noscript - só adicionar se não foi encontrado com o script anterior
      const fbPixelMatch = content.match(/facebook\.com\/tr\?id=(\d{15,16})/);
      if (fbPixelMatch) {
        const pixelId = fbPixelMatch[1];
        
        // Verificar se já foi processado com um script
        if (!pixelIdsFound.has(pixelId)) {
          const selector = `noscript:nth-of-type(${index + 1})`;
          
          if (!processedSelectors.has(selector)) {
            pixels.push({
              type: 'facebook',
              code: content,
              selector,
              html: $.html(element),
              url,
              id: pixelId,
            });
            processedSelectors.add(selector);
            pixelIdsFound.add(pixelId);
          }
        }
      }

      // Google Analytics noscript
      const gaMatch = content.match(/google-analytics\.com\/ga\.js/);
      if (gaMatch && !fbPixelMatch) {
        const selector = `noscript:nth-of-type(${index + 1})`;
        if (!processedSelectors.has(selector)) {
          pixels.push({
            type: 'google',
            code: content,
            selector,
            html: $.html(element),
            url,
          });
          processedSelectors.add(selector);
        }
      }
    });

    // Facebook Pixel - Imagens de tracking (img tags)
    $('img[src*="facebook.com/tr"]').each((index, element) => {
      const $el = $(element);
      const src = $el.attr('src') || '';
      const pixelIdMatch = src.match(/id=(\d{15,16})/);
      
      if (pixelIdMatch) {
        const pixelId = pixelIdMatch[1];
        const selector = `img[src*="facebook.com/tr"]:nth-of-type(${index + 1})`;
        
        if (!processedSelectors.has(selector)) {
          pixels.push({
            type: 'facebook',
            code: src,
            selector,
            html: $.html(element),
            url,
            id: pixelId,
          });
          processedSelectors.add(selector);
        }
      }
    });

    return pixels;
  }

  static extractFacebookPixelId(code: string): string | undefined {
    // Padrão 1: fbq('init', 'PIXEL_ID')
    const match1 = code.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]?(\d{15,16})['"]?/);
    if (match1) return match1[1];
    
    // Padrão 2: facebook.net/tr?id=PIXEL_ID
    const match2 = code.match(/facebook\.net\/tr\?id=(\d{15,16})/);
    if (match2) return match2[1];
    
    // Padrão 3: facebook.com/tr?id=PIXEL_ID
    const match3 = code.match(/facebook\.com\/tr\?id=(\d{15,16})/);
    if (match3) return match3[1];
    
    // Padrão 4: pixelId: 'PIXEL_ID'
    const match4 = code.match(/pixelId['":\s]*['"]?(\d{15,16})['"]?/);
    if (match4) return match4[1];
    
    // Padrão 5: 'PIXEL_ID' (número de 15-16 dígitos isolado)
    const match5 = code.match(/['"](\d{15,16})['"]/);
    if (match5 && !match5[1].startsWith('0')) return match5[1];
    
    return undefined;
  }

  static extractGooglePixelId(code: string): string | undefined {
    // Padrão 1: UA-XXXXX-Y (Google Analytics Universal)
    const match1 = code.match(/['"]?(UA-\d{4,10}-\d{1,4})['"]?/);
    if (match1) return match1[1];
    
    // Padrão 2: G-XXXXXXXXXX (Google Analytics 4)
    const match2 = code.match(/['"]?(G-[A-Z0-9]{10,})['"]?/);
    if (match2) return match2[1];
    
    // Padrão 3: gtag('config', 'MEASUREMENT_ID')
    const match3 = code.match(/gtag\(['"]config['"]\s*,\s*['"]([^'"]+)['"]/);
    if (match3) return match3[1];
    
    // Padrão 4: ga('create', 'UA-XXXXX-Y', 'auto')
    const match4 = code.match(/ga\(['"]create['"]\s*,\s*['"](UA-[^'"]+)['"]/);
    if (match4) return match4[1];
    
    // Padrão 5: GTM-XXXXXXX (Google Tag Manager)
    const match5 = code.match(/['"]?(GTM-[A-Z0-9]{4,})['"]?/);
    if (match5) return match5[1];
    
    return undefined;
  }

  static generateSelector($el: cheerio.Cheerio<cheerio.Element>): string {
    // Tentar criar um seletor único
    const id = $el.attr('id');
    if (id) return `#${id}`;

    const classes = $el.attr('class');
    if (classes) {
      const classList = classes.split(' ').filter(c => c);
      if (classList.length > 0) {
        return `.${classList[0]}`;
      }
    }

    const tag = $el.prop('tagName')?.toLowerCase();
    return tag || 'element';
  }

  static replaceButtonText(html: string, selector: string, newText: string, newHref?: string): string {
    const $ = cheerio.load(html);
    const $element = $(selector);
    
    if ($element.length > 0) {
      // Atualizar texto
      if ($element.is('input')) {
        $element.attr('value', newText);
      } else {
        $element.text(newText);
      }
      
      // Se for um link ou tiver link dentro, atualizar href
      if (newHref !== undefined && newHref.trim() !== '') {
        if ($element.is('a')) {
          // É um link direto
          $element.attr('href', newHref);
        } else if ($element.is('button')) {
          // Se for button, pode ter onclick ou precisa envolver em link
          const $link = $element.find('a').first();
          if ($link.length > 0) {
            $link.attr('href', newHref);
          } else {
            // Adicionar onclick ou envolver em link
            $element.attr('onclick', `window.location.href='${newHref}'`);
          }
        } else {
          // Se for div/span, procurar link dentro
          const $link = $element.find('a').first();
          if ($link.length > 0) {
            $link.attr('href', newHref);
            $link.text(newText);
          } else {
            // Se não tiver link, criar um dentro
            const $newLink = $('<a></a>').attr('href', newHref).text(newText);
            $element.empty().append($newLink);
          }
        }
      }
      
      return $.html();
    }
    
    return html;
  }

  static replacePixel(html: string, selector: string, pixelType: string, newPixelHtml?: string, newPixelToken?: string): string {
    const $ = cheerio.load(html);
    const $element = $(selector);
    
    if ($element.length === 0) {
      return html;
    }

    if (pixelType === 'facebook') {
      // Se forneceu HTML completo, substituir usando o template
      if (newPixelHtml) {
        // Extrair script e noscript do template fornecido
        const scriptMatch = newPixelHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        const noscriptMatch = newPixelHtml.match(/<noscript>([\s\S]*?)<\/noscript>/);
        
        if ($element.is('script')) {
          // Atualizar o script
          if (scriptMatch) {
            $element.html(scriptMatch[1].trim());
          }
          
          // Atualizar ou criar o noscript seguinte
          let $noscript = $element.next('noscript');
          if ($noscript.length === 0) {
            // Criar noscript após o script se não existir
            $noscript = $('<noscript></noscript>');
            $element.after($noscript);
          }
          if (noscriptMatch) {
            $noscript.html(noscriptMatch[1].trim());
          }
        } else if ($element.is('noscript')) {
          // Se estamos editando o noscript, atualizar ele e procurar o script anterior
          if (noscriptMatch) {
            $element.html(noscriptMatch[1].trim());
          }
          
          // Procurar script anterior
          let $script = $element.prev('script');
          if ($script.length === 0) {
            // Procurar em parent
            $script = $element.parent().find('script').filter((_, el) => {
              const content = $(el).html() || '';
              return /fbq\s*\(/.test(content) || /connect\.facebook\.net/.test(content);
            }).last();
          }
          if ($script.length > 0 && scriptMatch) {
            $script.html(scriptMatch[1].trim());
          } else if (scriptMatch) {
            // Criar script antes do noscript se não existir
            $script = $('<script></script>');
            $script.html(scriptMatch[1].trim());
            $element.before($script);
          }
        } else {
          // Substituição direta se não for script nem noscript
          $element.html(newPixelHtml);
        }
        return $.html();
      }

      // Se forneceu apenas o token, atualizar o ID no código existente (script + noscript)
      if (newPixelToken) {
        const currentHtml = $element.html() || '';
        
        // Atualizar em scripts
        if ($element.is('script')) {
          let updatedCode = currentHtml
            .replace(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]?\d{15,16}['"]?/g, `fbq('init', '${newPixelToken}'`)
            .replace(/facebook\.net\/tr\?id=\d{15,16}/g, `facebook.net/tr?id=${newPixelToken}`);
          
          $element.html(updatedCode);
          
          // Atualizar noscript correspondente se existir
          let $noscript = $element.next('noscript');
          if ($noscript.length > 0) {
            const noscriptHtml = $noscript.html() || '';
            const updatedNoscript = noscriptHtml
              .replace(/facebook\.com\/tr\?id=\d{15,16}/g, `facebook.com/tr?id=${newPixelToken}`)
              .replace(/id=(\d{15,16})/g, `id=${newPixelToken}`);
            $noscript.html(updatedNoscript);
          }
        }
        // Atualizar em noscript (imagens)
        else if ($element.is('noscript')) {
          const updatedHtml = currentHtml
            .replace(/facebook\.com\/tr\?id=\d{15,16}/g, `facebook.com/tr?id=${newPixelToken}`)
            .replace(/id=(\d{15,16})/g, `id=${newPixelToken}`);
          $element.html(updatedHtml);
          
          // Atualizar script anterior se existir
          let $script = $element.prev('script');
          if ($script.length === 0) {
            // Procurar script relacionado no mesmo parent
            $script = $element.parent().find('script').filter((_, el) => {
              const content = $(el).html() || '';
              return /fbq\s*\(/.test(content) || /connect\.facebook\.net/.test(content);
            }).last();
          }
          if ($script.length > 0) {
            const scriptHtml = $script.html() || '';
            const updatedScript = scriptHtml.replace(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]?\d{15,16}['"]?/g, `fbq('init', '${newPixelToken}'`);
            $script.html(updatedScript);
          }
        }
        // Atualizar em meta tags
        else if ($element.is('meta')) {
          const content = $element.attr('content') || '';
          if (/^\d{15,16}$/.test(content)) {
            $element.attr('content', newPixelToken);
          } else {
            const updatedContent = content.replace(/\d{15,16}/g, newPixelToken);
            $element.attr('content', updatedContent);
          }
        }
        // Atualizar em imagens
        else if ($element.is('img')) {
          const src = $element.attr('src') || '';
          const updatedSrc = src.replace(/id=\d{15,16}/g, `id=${newPixelToken}`);
          $element.attr('src', updatedSrc);
        }
      }
    } else if (pixelType === 'google') {
      // Se forneceu HTML completo, substituir diretamente
      if (newPixelHtml) {
        $element.html(newPixelHtml);
        return $.html();
      }

      // Se forneceu apenas o token/ID, atualizar no código existente
      if (newPixelToken) {
        const currentHtml = $element.html() || '';
        
        if ($element.is('script')) {
          let updatedCode = currentHtml
            .replace(/gtag\(['"]config['"]\s*,\s*['"]([^'"]+)['"]/g, `gtag('config', '${newPixelToken}'`)
            .replace(/ga\(['"]create['"]\s*,\s*['"](UA-[^'"]+)['"]/g, `ga('create', '${newPixelToken}'`)
            .replace(/['"]?(UA-\d+-\d+)['"]?/g, `'${newPixelToken}'`)
            .replace(/['"]?(G-[A-Z0-9]+)['"]?/g, `'${newPixelToken}'`)
            .replace(/['"]?(GTM-[A-Z0-9]+)['"]?/g, `'${newPixelToken}'`);
          $element.html(updatedCode);
        }
      }
    } else {
      // Para outros tipos de pixel, substituir HTML completo se fornecido
      if (newPixelHtml) {
        $element.html(newPixelHtml);
      }
    }
    
    return $.html();
  }

  static removePixel(html: string, selector: string): string {
    const $ = cheerio.load(html);
    $(selector).remove();
    return $.html();
  }
}

