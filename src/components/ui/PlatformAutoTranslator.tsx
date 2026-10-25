import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { translatePlatformText } from '../../lib/i18nEngine';

const originalNodeText = new WeakMap<Text, string>();
const lastAppliedNodeText = new WeakMap<Text, string>();
const originalAttrText = new WeakMap<Element, Record<string, string>>();

const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const;

/**
 * Traduit automatiquement l'intégralité de la plateforme Nia-Mind (toutes les pages,
 * formulaires, boutons, cartes, modales, questionnaires et résultats) selon la langue
 * choisie par l'utilisateur actif, uniquement sur son propre affichage.
 */
export const PlatformAutoTranslator: React.FC = () => {
  const { currentLanguage } = useApp();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    let isApplying = false;

    const shouldSkipElement = (el: Element | null): boolean => {
      if (!el) return true;
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'NOSCRIPT') {
        return true;
      }
      if (el.getAttribute('aria-label') === 'Sélecteur de langue') {
        return true;
      }
      return Boolean(el.closest('[data-no-translate="true"]'));
    };

    const translateRoot = (root: Node = document.body) => {
      if (!root || isApplying) return;
      isApplying = true;
      try {
        // 1. Traduction de tous les nœuds de texte visibles
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement;
            if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        let currentNode = walker.nextNode() as Text | null;
        while (currentNode) {
          const currentVal = currentNode.nodeValue || '';
          if (currentVal.trim().length > 0) {
            const lastApplied = lastAppliedNodeText.get(currentNode);
            if (!originalNodeText.has(currentNode) || (lastApplied !== undefined && currentVal !== lastApplied)) {
              originalNodeText.set(currentNode, currentVal);
            }
            const sourceText = originalNodeText.get(currentNode) || currentVal;
            const nextVal =
              currentLanguage === 'fr'
                ? sourceText
                : translatePlatformText(sourceText, currentLanguage);

            if (currentNode.nodeValue !== nextVal) {
              currentNode.nodeValue = nextVal;
            }
            lastAppliedNodeText.set(currentNode, nextVal);
          }
          currentNode = walker.nextNode() as Text | null;
        }

        // 2. Traduction des attributs (placeholder, title, aria-label)
        if (root instanceof Element || root instanceof Document) {
          const elements = root.querySelectorAll('[placeholder], [title], [aria-label]');
          elements.forEach((el) => {
            if (shouldSkipElement(el)) return;
            let savedAttrs = originalAttrText.get(el);
            if (!savedAttrs) {
              savedAttrs = {};
              originalAttrText.set(el, savedAttrs);
            }
            for (const attr of TRANSLATABLE_ATTRS) {
              const val = el.getAttribute(attr);
              if (!val || !val.trim()) continue;
              if (!(attr in savedAttrs)) {
                savedAttrs[attr] = val;
              }
              const sourceAttr = savedAttrs[attr];
              const nextAttr =
                currentLanguage === 'fr'
                  ? sourceAttr
                  : translatePlatformText(sourceAttr, currentLanguage);
              if (el.getAttribute(attr) !== nextAttr) {
                el.setAttribute(attr, nextAttr);
              }
            }
          });
        }
      } finally {
        isApplying = false;
      }
    };

    translateRoot(document.body);

    const observer = new MutationObserver(() => {
      if (!isApplying) {
        translateRoot(document.body);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [currentLanguage, location.pathname]);

  return null;
};
