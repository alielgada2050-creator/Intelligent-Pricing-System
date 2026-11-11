/* Authentication shell. Google Identity Services is enabled only after a valid client ID is configured. */
(function () {
  'use strict';
  const SESSION = 'sec.auth.session.v1', CLIENT_ID = 'sec.auth.googleClientId.v1';
  const get = () => { try { return JSON.parse(localStorage.getItem(SESSION)) || null; } catch (_) { return null; } };
  const set = user => localStorage.setItem(SESSION, JSON.stringify(user));
  const escape = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const decodeJwt = token => { try { return JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))); } catch (_) { return null; } };
  const close = () => document.getElementById('auth-modal')?.remove();
  function updateChrome() {
    const mount = document.getElementById('auth-account'); if (!mount) return;
    const user = get();
    mount.innerHTML = user ? `<button class="account-chip" onclick="Auth.openAccount()" aria-label="إدارة حساب ${escape(user.name)}"><span class="account-avatar">${escape((user.name || 'U').trim().slice(0,1).toUpperCase())}</span><span class="account-copy"><b>${escape(user.name)}</b><small>${escape(user.role || 'مدير مشروع')}</small></span></button>` : `<button class="btn btn-primary btn-sm" onclick="Auth.openLogin()">تسجيل الدخول</button>`;
  }
  function renderGoogle(container) {
    const clientId = localStorage.getItem(CLIENT_ID);
    if (!clientId) { container.innerHTML = `<button class="google-fallback" type="button" onclick="Auth.openSetup()"><span aria-hidden="true">G</span> إعداد تسجيل Google</button><p class="auth-note">يتطلب Client ID من Google Cloud وربط نطاق HTTPS.</p>`; return; }
    const tryRender = () => {
      if (!(window.google && google.accounts && google.accounts.id)) { setTimeout(tryRender, 250); return; }
      google.accounts.id.initialize({ client_id: clientId, callback: response => Auth.handleGoogleCredential(response) });
      google.accounts.id.renderButton(container, { theme:'outline', size:'large', text:'signin_with', shape:'rectangular', locale:'ar' });
    };
    tryRender();
  }
  window.Auth = {
    current: get,
    init: updateChrome,
    openLogin() {
      close(); document.body.insertAdjacentHTML('beforeend', `<div class="auth-modal" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div class="auth-dialog"><button class="auth-close" onclick="Auth.close()" aria-label="إغلاق نافذة تسجيل الدخول">×</button><div class="auth-logo-wrap"><img class="auth-brand-logo" src="images/alasas_logo.png" alt="شعار شركة الأساس العريض للمقاولات"></div><h2 id="auth-title">الدخول إلى منصة العقود</h2><p>استخدم حساب العمل للوصول إلى المشاريع والمقايسات بحسب الصلاحية.</p><div id="google-signin-mount" class="google-signin-mount"></div><div class="auth-divider"><span>أو</span></div><button class="auth-guest" onclick="Auth.demoLogin()">دخول تجريبي بصلاحية مدير مشروع</button><p class="auth-note">للتشغيل الفعلي: يتم التحقق من رمز Google على الخادم قبل إنشاء الجلسة.</p></div></div>`); renderGoogle(document.getElementById('google-signin-mount')); document.querySelector('.auth-close')?.focus();
    },
    close,
    demoLogin() { set({ name:'مستخدم تجريبي', email:'demo@company.sa', role:'مدير مشروع', provider:'demo', signedAt:new Date().toISOString() }); close(); updateChrome(); window.toast?.('تم تسجيل دخول تجريبي — لا تستخدمه للإنتاج','info'); },
    handleGoogleCredential(response) {
      const claims = decodeJwt(response && response.credential); if (!claims || !claims.email) { window.toast?.('تعذر قراءة بيانات حساب Google','error'); return; }
      // Preview only: production must POST the JWT to a server and verify aud/iss/exp/signature.
      set({ name:claims.name || claims.email.split('@')[0], email:claims.email, picture:claims.picture || '', role:'مستخدم مشروع', provider:'google-preview', signedAt:new Date().toISOString() }); close(); updateChrome(); window.toast?.('تم تسجيل الدخول محلياً؛ فعّل التحقق الخادمي قبل الإنتاج','warning');
    },
    openAccount() {
      const u=get(); if(!u) return this.openLogin();
      close(); document.body.insertAdjacentHTML('beforeend', `<div class="auth-modal" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="account-title"><div class="auth-dialog"><button class="auth-close" onclick="Auth.close()" aria-label="إغلاق">×</button><div class="auth-mark" aria-hidden="true">${escape((u.name||'U')[0])}</div><h2 id="account-title">${escape(u.name)}</h2><p>${escape(u.email)}<br><b>${escape(u.role)}</b></p><div class="role-grid"><button type="button" onclick="Auth.setRole('مسعّر')">مسعّر</button><button type="button" onclick="Auth.setRole('مدير مشروع')">مدير مشروع</button><button type="button" onclick="Auth.setRole('مدير مالي')">مدير مالي</button><button type="button" onclick="Auth.setRole('مدير نظام')">مدير نظام</button></div><button class="auth-guest danger" onclick="Auth.signOut()">تسجيل الخروج</button></div></div>`);
    },
    setRole(role) { const u=get(); if(!u)return; u.role=role; set(u); close(); updateChrome(); window.toast?.('تم تحديث الدور محلياً','success'); },
    signOut() { localStorage.removeItem(SESSION); try { window.google?.accounts?.id?.disableAutoSelect(); } catch (_) {} close(); updateChrome(); window.toast?.('تم تسجيل الخروج','success'); },
    openSetup() {
      close(); const existing=localStorage.getItem(CLIENT_ID)||''; document.body.insertAdjacentHTML('beforeend', `<div class="auth-modal" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="google-title"><div class="auth-dialog"><button class="auth-close" onclick="Auth.close()" aria-label="إغلاق">×</button><h2 id="google-title">إعداد Google Sign-In</h2><p>أدخل OAuth 2.0 Web Client ID فقط. لا تضع Client Secret في المتصفح.</p><label class="form-label" for="google-client-id">Google Client ID</label><input id="google-client-id" class="form-control" autocomplete="off" placeholder="xxxx.apps.googleusercontent.com" value="${escape(existing)}"><p class="auth-note">أضف نطاق الإنتاج وlocalhost للتطوير ضمن Authorized JavaScript origins في Google Cloud، ثم فعّل تحقق JWT على الخادم.</p><button class="btn btn-primary btn-full" onclick="Auth.saveGoogleSetup()">حفظ الإعداد</button></div></div>`); document.getElementById('google-client-id')?.focus();
    },
    saveGoogleSetup() { const id=document.getElementById('google-client-id')?.value.trim(); if(!id || !id.endsWith('.apps.googleusercontent.com')) { window.toast?.('أدخل Google Client ID صحيحاً','warning'); return; } localStorage.setItem(CLIENT_ID,id); close(); this.openLogin(); },
  };
  document.addEventListener('DOMContentLoaded', updateChrome);
}());
