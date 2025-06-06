// 設定ページ（後回しでも可）

// /app/dashboard/settings/page.js
import React from 'react';

const SettingsPage = () => {
  return (
    <div>
      <h1>Settings</h1>
      <p>Here you can adjust your preferences and settings.</p>

      <section>
        <h2>Profile Settings</h2>
        <form>
          <div>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" />
          </div>
          <div>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" />
          </div>
          <button type="submit">Save</button>
        </form>
      </section>

      <section>
        <h2>Account Settings</h2>
        <form>
          <div>
            <label htmlFor="password">Change Password:</label>
            <input type="password" id="password" name="password" />
          </div>
          <button type="submit">Update</button>
        </form>
      </section>
    </div>
  );
};

export default SettingsPage;
