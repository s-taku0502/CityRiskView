'use client';

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';

const eventOptions = [
  { value: '', label: 'イベントを選択してください' },
  { value: 'event1', label: '技育campキャラバン' },
  { value: 'event2', label: '技育campハッカソン' },
  { value: 'event3', label: '技育博' },
  { value: 'event4', label: 'ぼうさいこくたい' },
  { value: 'other', label: 'その他' },
];

export default function ContactForm() {
  const [state, handleSubmit] = useForm("myzdvjdj");
  if (state.succeeded) {
    return <p>送信ありがとうございました！</p>;
  }
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 400,
          width: '100%',
          padding: 32,
          border: '2px solid #000',
          borderRadius: 12,
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>システム改善アンケート</h2>

        <label htmlFor="event" style={{ fontWeight: 'bold' }}>参加イベント名<span style={{color:'red'}}> *</span></label>
        <select
          id="event"
          name="event"
          required
          defaultValue=""
          style={{
            width: '100%',
            marginBottom: 10,
            padding: '6px',
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        >
          {eventOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ValidationError prefix="Event" field="event" errors={state.errors} />

        <label htmlFor="name" style={{ fontWeight: 'bold' }}>氏名</label>
        <input
          id="name"
          type="text"
          name="name"
          style={{
            width: '100%',
            marginBottom: 10,
            padding: '6px',
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />
        <ValidationError prefix="Name" field="name" errors={state.errors} />

        <label htmlFor="email" style={{ fontWeight: 'bold' }}>メールアドレス</label>
        <input
          id="email"
          type="email"
          name="email"
          style={{
            width: '100%',
            marginBottom: 10,
            padding: '6px',
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />
        <ValidationError prefix="Email" field="email" errors={state.errors} />

        <label htmlFor="affiliation" style={{ fontWeight: 'bold' }}>所属</label>
        <textarea
          id="affiliation"
          name="affiliation"
          rows={2}
          style={{
            width: '100%',
            marginBottom: 10,
            padding: '6px',
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />
        <ValidationError prefix="Affiliation" field="affiliation" errors={state.errors} />

        <label htmlFor="feedback" style={{ fontWeight: 'bold' }}>ご意見・感想<span style={{color:'red'}}> *</span></label>
        <textarea
          id="feedback"
          name="feedback"
          required
          rows={5}
          style={{
            width: '100%',
            marginBottom: 10,
            padding: '6px',
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />
        <ValidationError prefix="Feedback" field="feedback" errors={state.errors} />

        <button
          type="submit"
          disabled={state.submitting}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 6,
            border: 'none',
            background: '#1976d2',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            marginTop: 8
          }}
        >
          送信
        </button>
      </form>
    </div>
  );
}