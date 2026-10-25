import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  canonicalizeToFrench,
  getHtmlLangAttribute,
  SupportedLanguage,
  translatePlatformText,
} from '../../lib/i18nEngine';

interface NodeTranslationRecord {
  sourceFr: string;
  appliedValues: Set<string>;
}

const nodeRecords = new WeakMap<Text, NodeTranslationRecord>();
const attrRecords = new WeakMap<Element, Record<string, NodeTranslationRecord>>();

const TRANSLATABLE_ATTRS = [
  'placeholder',
  'title',
  'aria-label',
  'alt',
  'data-text',
] as const;

/**
 * Synchronise en temps réel 100 % des textes, attributs, placeholders, modales,
 * questionnaires, récits et formulaires de la plateforme avec les dictionnaires
 * centralisés `src/locales/{fr,en,es,de,zh-CN}` dès que la langue change.
 */
export const PlatformAutoTranslator: React.FC = () => {
  const { currentLanguage } = useApp();
  const location = useLocation();

  useEffect(() => {
    const activeLang: SupportedLanguage = currentLanguage;
    document.documentElement.lang = getHtmlLangAttribute(activeLang);
    let isApplying = false;
    let isUnmounted = false;

    const shouldSkipElement = (el: Element | null): boolean => {
      if (!el) return true;
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'NOSCRIPT') {
        return true;
      }
      return Boolean(el.closest('[data-no-translate="true"]'));
    };

    const translateRoot = (root: Node = document.body) => {
      if (!root || isApplying || isUnmounted) return;
      isApplying = true;
      try {
        // 1. Parcourir et traduire tous les nœuds de texte du DOM
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement;
            if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        let currentNode = walker.nextNode() as Text | null;
        while (currentNode) {
          const textNode = currentNode;
          const currentVal = textNode.nodeValue || '';
          const trimmed = currentVal.trim();

          if (trimmed.length > 0 && !/^[0-9\s•—–\-:/+%().,@#?!]+$/.test(trimmed)) {
            let rec = nodeRecords.get(textNode);
            if (!rec) {
              const sourceFr = canonicalizeToFrench(currentVal);
              rec = {
                sourceFr,
                appliedValues: new Set([currentVal, sourceFr]),
              };
              nodeRecords.set(textNode, rec);
            } else if (!rec.appliedValues.has(currentVal)) {
              const canonical = canonicalizeToFrench(currentVal);
              rec.sourceFr = canonical;
              rec.appliedValues.add(currentVal);
              rec.appliedValues.add(canonical);
            }

            const syncVal =
              activeLang === 'fr'
                ? rec.sourceFr
                : translatePlatformText(rec.sourceFr, activeLang);

            rec.appliedValues.add(syncVal);
            if (textNode.nodeValue !== syncVal) {
              textNode.nodeValue = syncVal;
            }
          }
          currentNode = walker.nextNode() as Text | null;
        }

        // 2. Traduire tous les attributs accessibles et visuels
        if (root instanceof Element || root instanceof Document) {
          const elements = root.querySelectorAll(
            '[placeholder], [title], [aria-label], [alt], [data-text]'
          );
          elements.forEach((el) => {
            if (shouldSkipElement(el)) return;
            let elAttrMap = attrRecords.get(el);
            if (!elAttrMap) {
              elAttrMap = {};
              attrRecords.set(el, elAttrMap);
            }
            for (const attr of TRANSLATABLE_ATTRS) {
              const val = el.getAttribute(attr);
              if (!val || !val.trim()) continue;
              let attrRec = elAttrMap[attr];
              if (!attrRec) {
                const sourceFr = canonicalizeToFrench(val);
                attrRec = {
                  sourceFr,
                  appliedValues: new Set([val, sourceFr]),
                };
                elAttrMap[attr] = attrRec;
              } else if (!attrRec.appliedValues.has(val)) {
                const canonical = canonicalizeToFrench(val);
                attrRec.sourceFr = canonical;
                attrRec.appliedValues.add(val);
                attrRec.appliedValues.add(canonical);
              }

              const nextAttr =
                activeLang === 'fr'
                  ? attrRec.sourceFr
                  : translatePlatformText(attrRec.sourceFr, activeLang);

              attrRec.appliedValues.add(nextAttr);
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
    const initialTimer = window.setTimeout(() => translateRoot(document.body), 40);

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

    const handleUserInteraction = () => {
      window.requestAnimationFrame(() => {
        translateRoot(document.body);
      });
    };

    window.addEventListener('click', handleUserInteraction, true);
    window.addEventListener('change', handleUserInteraction, true);

    return () => {
      isUnmounted = true;
      window.clearTimeout(initialTimer);
      observer.disconnect();
      window.removeEventListener('click', handleUserInteraction, true);
      window.removeEventListener('change', handleUserInteraction, true);
    };
  }, [currentLanguage, location.pathname]);

  return null;
};
