import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  acceptCommunityInvite,
  createCommunityInvite,
  explainCommunityError,
  generateCommunityPoster,
  hideCommunityMessage,
  loadCommunityRoom,
  postCommunityMessage,
  revokeCommunityInvite,
  scheduleCommunityPost,
  setCommunityDiscussion,
  type CommunityRoom,
} from '../../lib/communityApi';
import { isSafePosterSvg } from '../../lib/communityAgent';
import { tCommunity, tCommunityExtra } from '../../lib/communityI18n';

function Poster({ svg }: { svg: string | null }) {
  if (!svg || !isSafePosterSvg(svg)) return null;
  return (
    <img
      alt=""
      className="mt-2 w-full max-w-sm rounded-2xl border"
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
    />
  );
}

export const CommunityInvitePage: React.FC = () => {
  const { token = '' } = useParams();
  const { currentLanguage, currentUser, authReady } = useApp();
  const navigate = useNavigate();
  const [note, setNote] = useState('');

  const accept = () => {
    void acceptCommunityInvite(token).then((result) => {
      if (result.error || !result.id) {
        setNote(explainCommunityError(currentLanguage, { message: result.error || 'COMMUNITY_INVITE_INVALID' }));
        return;
      }
      navigate(`/communautes/espace/${result.id}`);
    });
  };

  return (
    <section className="mx-auto max-w-xl space-y-4 px-4 py-16">
      <Link to="/communautes" className="text-xs font-extrabold text-[#0F9F6E]">{tCommunityExtra(currentLanguage, 'back')}</Link>
      <h1 className="text-3xl font-extrabold">{tCommunityExtra(currentLanguage, 'roomTitle')}</h1>
      <p className="text-sm leading-relaxed">{tCommunityExtra(currentLanguage, 'roomLead')}</p>
      {!authReady ? null : currentUser ? (
        <button type="button" onClick={accept} className="rounded-full bg-[#0F9F6E] px-4 py-2 text-sm font-extrabold text-white">
          {tCommunityExtra(currentLanguage, 'inviteAccept')}
        </button>
      ) : (
        <Link to={`/connexion?redirect=/communautes/rejoindre/${token}`} className="inline-flex rounded-full bg-[#7F1D3F] px-4 py-2 text-sm font-extrabold text-white">
          {tCommunityExtra(currentLanguage, 'loginCta')}
        </Link>
      )}
      {note ? <p className="text-sm font-bold text-[#7F1D3F]">{note}</p> : null}
    </section>
  );
};

export const CommunityRoomPage: React.FC = () => {
  const { id = '' } = useParams();
  const { currentLanguage, currentUser, authReady } = useApp();
  const [room, setRoom] = useState<CommunityRoom | null>(null);
  const [note, setNote] = useState('');
  const [body, setBody] = useState('');
  const [posterText, setPosterText] = useState('');
  const [kind, setKind] = useState('motivation');
  const [when, setWhen] = useState('');
  const [preview, setPreview] = useState('');

  const reload = async () => {
    const result = await loadCommunityRoom(id);
    if (result.error) setNote(explainCommunityError(currentLanguage, { message: result.error }));
    setRoom(result.room);
  };

  useEffect(() => {
    if (!authReady || !currentUser || !id) return;
    void reload();
  }, [authReady, currentUser?.id, id]);

  if (!authReady) return <div className="px-4 py-16 text-sm font-bold">{tCommunityExtra(currentLanguage, 'working')}</div>;
  if (!currentUser) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16">
        <p className="mb-4 text-sm">{tCommunity(currentLanguage, 'needAccount')}</p>
        <Link to={`/connexion?redirect=/communautes/espace/${id}`} className="inline-flex rounded-full bg-[#0F9F6E] px-4 py-2 text-sm font-extrabold text-white">
          {tCommunityExtra(currentLanguage, 'loginCta')}
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 overflow-x-hidden px-4 py-8">
      <Link to="/communautes" className="text-xs font-extrabold text-[#0F9F6E]">{tCommunityExtra(currentLanguage, 'back')}</Link>
      <header>
        <h1 className="text-3xl font-extrabold">{room?.name || tCommunityExtra(currentLanguage, 'roomTitle')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-nia-gray-mid">{tCommunityExtra(currentLanguage, 'roomLead')}</p>
        {room ? (
          <p className="mt-2 text-xs font-bold text-[#7F1D3F]">
            {tCommunityExtra(currentLanguage, 'participantsLabel')} : {room.participants}
          </p>
        ) : null}
      </header>
      {note ? <p className="rounded-2xl bg-[#7F1D3F]/10 p-3 text-sm font-bold">{note}</p> : null}
      {room?.can_manage ? (
        <section className="space-y-3 rounded-3xl border p-4">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={room.discussion_open}
              onChange={(event) => {
                void setCommunityDiscussion(room.id, event.target.checked).then((error) => {
                  setNote(error ? explainCommunityError(currentLanguage, { message: error }) : tCommunityExtra(currentLanguage, event.target.checked ? 'discussionOpen' : 'discussionClosed'));
                  void reload();
                });
              }}
            />
            {tCommunityExtra(currentLanguage, 'discussionOpen')}
          </label>
          <button
            type="button"
            className="rounded-full bg-[#7F1D3F] px-4 py-2 text-xs font-extrabold text-white"
            onClick={() => {
              void createCommunityInvite(room.id).then((result) => {
                if (result.error || !result.token) {
                  setNote(explainCommunityError(currentLanguage, { message: result.error || '' }));
                  return;
                }
                const link = `${window.location.origin}/communautes/rejoindre/${result.token}`;
                void navigator.clipboard?.writeText(link);
                setNote(`${tCommunityExtra(currentLanguage, 'inviteCopied')} ${link}`);
                void reload();
              });
            }}
          >
            {tCommunityExtra(currentLanguage, 'inviteCreate')}
          </button>
          <ul className="space-y-2 text-xs">
            {room.invites.filter((item) => !item.revoked).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2">
                <span className="break-all">/communautes/rejoindre/{item.token} · {item.use_count}/{item.max_uses}</span>
                <button type="button" className="font-extrabold text-[#7F1D3F]" onClick={() => void revokeCommunityInvite(item.id).then(() => reload())}>
                  {tCommunityExtra(currentLanguage, 'revokeInvite')}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const publishAt = new Date(when);
              if (Number.isNaN(publishAt.getTime())) {
                setNote(tCommunityExtra(currentLanguage, 'unknownError'));
                return;
              }
              void scheduleCommunityPost(room.id, posterText, publishAt.toISOString(), kind).then((error) => {
                setNote(error ? explainCommunityError(currentLanguage, { message: error }) : tCommunityExtra(currentLanguage, 'scheduleSend'));
                setPosterText('');
                void reload();
              });
            }}
          >
            <h2 className="text-sm font-extrabold">{tCommunityExtra(currentLanguage, 'scheduleTitle')}</h2>
            <p className="text-xs leading-relaxed text-nia-gray-mid">{tCommunityExtra(currentLanguage, 'scheduleHint')}</p>
            <textarea value={posterText} onChange={(event) => setPosterText(event.target.value)} rows={3} className="w-full rounded-2xl border p-3 text-sm" />
            <label className="block text-xs font-extrabold">
              {tCommunityExtra(currentLanguage, 'scheduleAt')}
              <input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" required />
            </label>
            <label className="block text-xs font-extrabold">
              {tCommunityExtra(currentLanguage, 'posterKind')}
              <select value={kind} onChange={(event) => setKind(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
                <option value="proverb">{tCommunityExtra(currentLanguage, 'posterProverb')}</option>
                <option value="advice">{tCommunityExtra(currentLanguage, 'posterAdvice')}</option>
                <option value="motivation">{tCommunityExtra(currentLanguage, 'posterMotivation')}</option>
                <option value="none">{tCommunityExtra(currentLanguage, 'posterNone')}</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="rounded-full bg-[#0F9F6E] px-4 py-2 text-xs font-extrabold text-white">{tCommunityExtra(currentLanguage, 'scheduleSend')}</button>
              <button
                type="button"
                className="rounded-full border px-4 py-2 text-xs font-extrabold"
                onClick={() => {
                  void generateCommunityPoster(room.id, posterText, kind).then((result) => {
                    if (result.error || !result.svg) setNote(explainCommunityError(currentLanguage, { message: result.error || '' }));
                    else setPreview(result.svg);
                  });
                }}
              >
                {tCommunityExtra(currentLanguage, 'posterTitle')}
              </button>
            </div>
            <Poster svg={preview} />
          </form>
        </section>
      ) : null}
      <section className="space-y-3">
        {(room?.messages || []).map((message) => (
          <article key={message.id} className="rounded-3xl border bg-white/80 p-4 dark:bg-black/20">
            <p className="text-[11px] font-extrabold uppercase text-[#0F9F6E]">{message.kind}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
            <Poster svg={message.image_svg} />
            {room?.can_manage && message.status === 'visible' ? (
              <button type="button" className="mt-2 text-xs font-extrabold text-[#7F1D3F]" onClick={() => void hideCommunityMessage(message.id, true).then(() => reload())}>
                {tCommunityExtra(currentLanguage, 'hideMessage')}
              </button>
            ) : null}
          </article>
        ))}
      </section>
      {room?.can_post ? (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void postCommunityMessage(room.id, body).then((error) => {
              setNote(error ? explainCommunityError(currentLanguage, { message: error }) : '');
              if (!error) setBody('');
              void reload();
            });
          }}
        >
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder={tCommunityExtra(currentLanguage, 'messagePlaceholder')} className="min-w-0 flex-1 rounded-full border px-4 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-[#0F9F6E] px-4 py-2 text-xs font-extrabold text-white">{tCommunityExtra(currentLanguage, 'sendMessage')}</button>
        </form>
      ) : room ? (
        <p className="text-sm font-bold">{tCommunityExtra(currentLanguage, 'discussionClosed')}</p>
      ) : null}
    </div>
  );
};
