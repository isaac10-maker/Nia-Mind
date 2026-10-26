import React from 'react';
import {
  ChevronRight,
  Crown,
  Loader2,
  Lock,
  MessageSquarePlus,
  PanelLeft,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { NeuralChipIcon } from '../ui/NeuralChipIcon';
import { translateMessageForViewer, tUi, type LanguageCodeInput } from '../../lib/i18nEngine';
import type { AssistantConversation } from '../../lib/types';

function localeTag(language: string): string {
  return language === 'zh' ? 'zh-CN' : language || 'fr';
}

function formatMessageTime(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(localeTag(language), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatConversationStamp(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const locale = localeTag(language);
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat(
    locale,
    sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short' }
  ).format(date);
}

interface AssistantMessengerProps {
  currentLanguage: LanguageCodeInput;
  pseudonym: string;
  conversations: AssistantConversation[];
  activeConversation?: AssistantConversation;
  isHandedOver: boolean;
  isLoading: boolean;
  apiError: string | null;
  inputMessage: string;
  mobilePane: 'list' | 'chat';
  suggestionsOpen: boolean;
  visibleSuggestions: string[];
  focusedIncomingId: string | null;
  threadSpacer: number;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messageNodeRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onComposerResize: () => void;
  onSend: (text?: string) => void;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onAskDeleteConversation: (id: string) => void;
  onClearAllConversations: () => void;
  onClearMessages: (id: string) => void;
  onDeleteMessage: (conversationId: string, messageId: string) => void;
  onToggleHandover: () => void;
  onShowList: () => void;
  onDismissSuggestion: (suggestion: string) => void;
  onCloseSuggestions: () => void;
  onOpenSuggestions: () => void;
  onRestoreSuggestions: () => void;
}

export const AssistantMessenger: React.FC<AssistantMessengerProps> = ({
  currentLanguage,
  pseudonym,
  conversations,
  activeConversation,
  isHandedOver,
  isLoading,
  apiError,
  inputMessage,
  mobilePane,
  suggestionsOpen,
  visibleSuggestions,
  focusedIncomingId,
  threadSpacer,
  messagesContainerRef,
  messageNodeRefs,
  composerRef,
  onInputChange,
  onComposerResize,
  onSend,
  onSelectConversation,
  onCreateConversation,
  onAskDeleteConversation,
  onClearAllConversations,
  onClearMessages,
  onDeleteMessage,
  onToggleHandover,
  onShowList,
  onDismissSuggestion,
  onCloseSuggestions,
  onOpenSuggestions,
  onRestoreSuggestions,
}) => {
  const messages = activeConversation?.messages ?? [];
  const title = translateMessageForViewer(
    activeConversation?.title || 'Assistant Nia-Mind',
    currentLanguage
  );

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-3xl border border-nia-gray-light/80 dark:border-nia-border-dark bg-white dark:bg-nia-surface-dark shadow-[0_18px_50px_-28px_rgba(127,29,63,0.45)] flex">
      <aside
        className={`${
          mobilePane === 'chat' ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-[280px] xl:w-[300px] shrink-0 flex-col border-r border-nia-gray-light dark:border-nia-border-dark bg-nia-bg-light/70 dark:bg-nia-bg-dark/50 min-h-0`}
      >
        <div className="px-3.5 py-3.5 border-b border-nia-gray-light/80 dark:border-nia-border-dark flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-nia-gray-dark dark:text-white">
              Mes conversations
            </h2>
            <p className="text-[11px] text-nia-gray-mid dark:text-gray-400">
              {conversations.length === 1 ? '1 discussion' : `${conversations.length} discussions`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {conversations.length > 0 && (
              <button
                type="button"
                onClick={onClearAllConversations}
                title="Vider et nettoyer toutes les discussions"
                aria-label="Vider et nettoyer toutes les discussions"
                className="w-8 h-8 rounded-full inline-flex items-center justify-center text-rose-600 hover:bg-rose-500/15 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onCreateConversation}
              title="Nouvelle conversation"
              aria-label="Nouvelle conversation"
              className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-nia-orange hover:bg-nia-orange-deep text-white transition-colors"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto nia-chat-scroll p-2 space-y-1">
          {conversations.map((conv) => {
            const selected = conv.id === activeConversation?.id;
            const last = conv.messages[conv.messages.length - 1];
            const preview = translateMessageForViewer(
              last?.content || 'Nouvelle réflexion',
              currentLanguage
            );
            return (
              <div
                key={conv.id}
                className={`group flex items-start gap-2 rounded-2xl px-2.5 py-2.5 transition-colors ${
                  selected
                    ? 'bg-white dark:bg-nia-surface-dark shadow-sm ring-1 ring-nia-orange/40'
                    : 'hover:bg-white/80 dark:hover:bg-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectConversation(conv.id)}
                  className="flex-1 min-w-0 text-left flex items-start gap-2.5"
                >
                  <span
                    className={`mt-0.5 w-9 h-9 rounded-full shrink-0 inline-flex items-center justify-center ${
                      conv.handedOverToAdmin
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-nia-orange/15 text-nia-orange'
                    }`}
                  >
                    {conv.handedOverToAdmin ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      <NeuralChipIcon className="w-4 h-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-bold text-nia-gray-dark dark:text-white truncate">
                        {translateMessageForViewer(conv.title, currentLanguage)}
                      </span>
                      <span className="text-[10px] text-nia-gray-mid dark:text-gray-400 shrink-0">
                        {formatConversationStamp(conv.updatedAt || last?.createdAt || conv.createdAt, currentLanguage)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-nia-gray-mid dark:text-gray-400 truncate">
                      {preview}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onAskDeleteConversation(conv.id)}
                  aria-label={`Supprimer la conversation ${conv.title}`}
                  title="Supprimer"
                  className="mt-1 p-1.5 rounded-lg text-nia-gray-mid hover:text-rose-600 hover:bg-rose-500/10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <p className="px-3.5 py-3 border-t border-nia-gray-light/80 dark:border-nia-border-dark text-[11px] leading-relaxed text-nia-gray-mid dark:text-gray-400">
          <Lock className="w-3 h-3 inline mr-1 text-nia-orange" />
          Pack isolé <span data-no-translate="true">@{pseudonym}</span>
        </p>
      </aside>

      <section
        className={`${
          mobilePane === 'list' ? 'hidden lg:flex' : 'flex'
        } flex-1 min-w-0 min-h-0 flex-col`}
      >
        <header className="shrink-0 px-3 sm:px-4 py-3 border-b border-nia-gray-light/80 dark:border-nia-border-dark flex items-center gap-2.5">
          <button
            type="button"
            onClick={onShowList}
            className="lg:hidden w-8 h-8 rounded-full inline-flex items-center justify-center bg-nia-bg-light dark:bg-nia-bg-dark text-nia-gray-dark dark:text-white"
            aria-label="Discussions"
            title="Discussions"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div
            className={`w-9 h-9 rounded-full shrink-0 inline-flex items-center justify-center ${
              isHandedOver
                ? 'bg-emerald-500/15 text-emerald-700'
                : 'bg-sky-500/10 text-sky-700'
            }`}
          >
            {isHandedOver ? <Crown className="w-4 h-4" /> : <NeuralChipIcon className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm sm:text-[15px] font-extrabold text-nia-gray-dark dark:text-white truncate">
                {title}
              </h1>
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                  isHandedOver
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                }`}
              >
                {isHandedOver ? 'Relais Humain (Admin)' : 'Puce IA Active'}
              </span>
            </div>
            <p className="text-[11px] text-nia-gray-mid dark:text-gray-400 truncate">
              {isHandedOver
                ? tUi(currentLanguage, 'humanHandoverActive')
                : tUi(currentLanguage, 'privateAdminInterlocutorNotice')}
            </p>
          </div>
          {activeConversation && (
            <div className="flex items-center gap-1.5 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => onClearMessages(activeConversation.id)}
                  title="Vider tous les messages de cette discussion"
                  aria-label="Vider les messages"
                  className="w-8 h-8 rounded-full inline-flex items-center justify-center text-rose-600 hover:bg-rose-500/15 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={isHandedOver}
                onClick={onToggleHandover}
                title={
                  isHandedOver
                    ? tUi(currentLanguage, 'switchToAi')
                    : tUi(currentLanguage, 'switchToHuman')
                }
                className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11px] font-extrabold border transition-colors ${
                  isHandedOver
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                    : 'bg-nia-orange/10 border-nia-orange/30 text-nia-bordeaux dark:text-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isHandedOver ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                />
                <span className="hidden md:inline">
                  {isHandedOver
                    ? tUi(currentLanguage, 'switchToAi')
                    : tUi(currentLanguage, 'switchToHuman')}
                </span>
                <span className="md:hidden">{isHandedOver ? 'IA' : 'Humain'}</span>
              </button>
            </div>
          )}
        </header>

        <div
          ref={messagesContainerRef as React.Ref<HTMLDivElement>}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="nia-chat-thread flex-1 min-h-0 overflow-y-auto nia-chat-scroll px-3 sm:px-5 py-4"
        >
          {messages.length === 0 && !isLoading && (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-emerald-500/25 inline-flex items-center justify-center mb-3">
                <NeuralChipIcon className="w-8 h-8" />
              </div>
              <p className="text-sm font-extrabold text-nia-gray-dark dark:text-white">
                Prêt quand tu l’es.
              </p>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-nia-gray-mid dark:text-gray-400">
                Aucun message dans cette discussion. Écris librement ci-dessous ou clique sur une suggestion pour commencer.
              </p>
            </div>
          )}

          <div className="flex flex-col">
            {messages.map((msg, index) => {
              const previous = messages[index - 1];
              const next = messages[index + 1];
              const isUser = msg.sender === 'user';
              const isAdmin = msg.sender === 'admin';
              const isDiag = Boolean(msg.isDiagnosticBriefing);
              const grouped =
                Boolean(previous) &&
                previous.sender === msg.sender &&
                !isDiag &&
                !previous.isDiagnosticBriefing;
              const isFocused = msg.id === focusedIncomingId;
              const showTime =
                isFocused ||
                !next ||
                next.sender !== msg.sender ||
                Boolean(next.isDiagnosticBriefing) ||
                isDiag;
              const translatedContent = translateMessageForViewer(msg.content, currentLanguage);

              return (
                <div
                  key={msg.id}
                  ref={(node) => {
                    if (node) messageNodeRefs.current.set(msg.id, node);
                    else messageNodeRefs.current.delete(msg.id);
                  }}
                  className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} ${
                    grouped ? 'mt-1' : 'mt-3 first:mt-0'
                  }`}
                >
                  {!isUser && (
                    <div className="w-8 shrink-0">
                      {!grouped && (
                        <div
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${
                            isAdmin
                              ? 'bg-emerald-500/15 text-emerald-700'
                              : 'bg-white dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark'
                          }`}
                        >
                          {isDiag ? (
                            <Sparkles className="w-3.5 h-3.5 text-nia-orange" />
                          ) : isAdmin ? (
                            <Crown className="w-3.5 h-3.5" />
                          ) : (
                            <NeuralChipIcon className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`group max-w-[min(78%,34rem)] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isUser && !grouped && (
                      <span className="mb-1 px-1 text-[10px] font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
                        {isDiag
                          ? `${tUi(currentLanguage, 'psychicDiagnosticBtn')} • Bilan IA & Admin`
                          : isAdmin
                            ? 'Administrateur Nia-Mind (Écoute Humaine)'
                            : 'Nia-Mind IA'}
                      </span>
                    )}
                    <div className={`flex items-end gap-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                          isFocused ? 'nia-message-focus ' : ''
                        }${
                          isUser
                            ? 'bg-gradient-to-br from-nia-orange to-nia-orange-deep text-white rounded-br-md shadow-sm'
                            : isDiag
                              ? 'bg-gradient-to-br from-nia-bordeaux/10 via-amber-500/10 to-sky-500/10 border border-nia-bordeaux/40 text-nia-gray-dark dark:text-white rounded-bl-md'
                              : isAdmin
                                ? 'bg-emerald-500/10 border border-emerald-500/35 text-nia-gray-dark dark:text-white rounded-bl-md'
                                : 'bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light/80 dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-100 rounded-bl-md'
                        }`}
                      >
                        {translatedContent}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          activeConversation && onDeleteMessage(activeConversation.id, msg.id)
                        }
                        title="Supprimer ce message"
                        aria-label="Supprimer ce message"
                        className="mb-1 p-1.5 rounded-full text-nia-gray-mid hover:text-rose-600 hover:bg-rose-500/10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {showTime && (
                      <time className="mt-1 px-1 text-[10px] text-nia-gray-mid dark:text-gray-500">
                        {formatMessageTime(msg.createdAt, currentLanguage)}
                      </time>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isLoading && (
            <div
              data-nia-thinking="true"
              className="mt-4 flex items-end gap-2 animate-nia-slide-in"
            >
              <div className="w-8 h-8 rounded-full bg-white dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark inline-flex items-center justify-center">
                <NeuralChipIcon className="w-4 h-4" />
              </div>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white dark:bg-nia-bg-dark border border-nia-orange/30 text-xs font-bold text-nia-gray-dark dark:text-white shadow-sm">
                <Loader2 className="w-3.5 h-3.5 text-nia-orange animate-spin" />
                <span>{tUi(currentLanguage, 'assistantThinking')}</span>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              {apiError}
            </div>
          )}

          <div aria-hidden="true" style={{ height: messages.length > 0 || isLoading ? threadSpacer : 0 }} />
        </div>

        <div className="shrink-0 border-t border-nia-gray-light/80 dark:border-nia-border-dark bg-white/95 dark:bg-nia-surface-dark/95">
          {suggestionsOpen ? (
            <div className="px-3 sm:px-4 pt-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-nia-gray-mid dark:text-gray-400">
                  Suggestions pour démarrer :
                </p>
                <button
                  type="button"
                  onClick={onCloseSuggestions}
                  aria-label="Retirer les suggestions"
                  title="Retirer les suggestions"
                  className="w-6 h-6 rounded-full inline-flex items-center justify-center text-nia-gray-mid hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {visibleSuggestions.length > 0 ? (
                <div className="nia-suggestion-row flex gap-2 overflow-x-auto nia-chat-scroll pb-2">
                  {visibleSuggestions.map((suggestion) => (
                    <div
                      key={suggestion}
                      className="shrink-0 max-w-[240px] inline-flex items-start gap-1 pl-3 pr-1 py-1.5 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark"
                    >
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => onSend(suggestion)}
                        className="text-left text-xs leading-snug font-medium text-nia-gray-dark dark:text-gray-200 hover:text-nia-orange disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissSuggestion(suggestion)}
                        aria-label="Retirer cette suggestion"
                        title="Retirer cette suggestion"
                        className="w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center text-nia-gray-mid hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 pb-2">
                  <p className="text-xs text-nia-gray-mid dark:text-gray-400">
                    Suggestions retirées. Tu peux les rétablir si tu en as besoin.
                  </p>
                  <button
                    type="button"
                    onClick={onRestoreSuggestions}
                    className="shrink-0 text-xs font-extrabold text-nia-orange hover:text-nia-orange-deep"
                  >
                    Réinitialiser les suggestions
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 sm:px-4 pt-2 flex justify-end">
              <button
                type="button"
                onClick={onOpenSuggestions}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-nia-gray-mid hover:text-nia-orange"
              >
                <ChevronRight className="w-3 h-3" />
                Afficher les suggestions
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSend();
            }}
            className="pl-3 sm:pl-4 pr-[4.75rem] pb-3 pt-1 flex items-end gap-2"
          >
            <textarea
              ref={composerRef as React.Ref<HTMLTextAreaElement>}
              rows={1}
              value={inputMessage}
              onChange={(event) => {
                onInputChange(event.target.value);
                onComposerResize();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder="Écris librement ici…"
              className="flex-1 resize-none px-4 py-3 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm leading-relaxed focus:outline-none focus:border-nia-orange min-h-12 max-h-[120px]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              aria-label="Envoyer"
              className="w-11 h-11 shrink-0 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep disabled:opacity-40 text-white inline-flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
