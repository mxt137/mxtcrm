// js/app.js

// 1. KHỞI TẠO KẾT NỐI SUPABASE
const SUPABASE_URL = 'https://gtejayfruwgkgqrkzlnr.supabase.co'; //[cite: 3, 8]
const SUPABASE_KEY = 'sb_publishable_-l85rAUCVMpXC1bUNrjbVQ_cwWO-PoU'; //[cite: 3, 8]
window.sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); //
window.currentUser = null; //

// 2. HÀM XÁC THỰC PHIÊN ĐĂNG NHẬP (Giữ nguyên logic từ file cũ)
async function verifySystemAccess() {
  const sessionStr = localStorage.getItem('crm_session');
  if (!sessionStr) { forceLogout(); return false; }
  
  const session = JSON.parse(sessionStr);
  window.currentUser = session;

  try {
    const { data, error } = await window.sbClient
      .from('safe_members')
      .select('is_active, password_version')
      .eq('id', session.id)
      .single();

    if (error || !data || data.is_active === false) { forceLogout('Tài khoản đã bị vô hiệu hóa!'); return false; }
    if (data.password_version !== session.password_version) { forceLogout('Mật khẩu đã bị đổi!'); return false; }
    
    return true;
  } catch (e) { return false; }
}

// 3. ROUTER ĐỘNG: TẢI HTML TỪ THƯ MỤC PAGES/
async function switchPage(pageId) {
  const isValid = await verifySystemAccess();
  if (!isValid) return; 

  const moduleDiv = document.getElementById('module-' + pageId);
  
  // Nếu thẻ div đang trống, hệ thống sẽ tự động fetch file HTML tương ứng để bơm vào
  if (moduleDiv.innerHTML.trim() === '') {
    try {
      const response = await fetch(`pages/page_${pageId}.html`);
      if (response.ok) {
        moduleDiv.innerHTML = await response.text();
      } else {
        moduleDiv.innerHTML = `<div class="p-4 text-danger">Không tìm thấy file pages/page_${pageId}.html</div>`;
      }
    } catch (error) {
      console.error('Lỗi tải giao diện:', error);
    }
  }

  // Ẩn tất cả các module và chỉ hiện module được chọn
  document.querySelectorAll('.app-module').forEach(el => el.style.display = 'none');
  moduleDiv.style.display = 'block';

  // Chỉnh hiệu ứng CSS cho Menu bên trái
  document.querySelectorAll('.nav-menu').forEach(el => el.classList.remove('active'));
  const activeNavLink = document.getElementById('nav-' + pageId);
  if(activeNavLink) activeNavLink.classList.add('active');

  // Kích hoạt hàm khởi tạo dữ liệu riêng của từng trang (Giữ nguyên logic gọi hàm cũ)
  if (pageId === 'dashboard' && typeof loadDashboardStats === 'function') loadDashboardStats(); //[cite: 4]
  if (pageId === 'member' && typeof loadMembers === 'function') loadMembers(); //[cite: 4]
}

// 4. KHỞI TẠO ỨNG DỤNG LÚC MỚI VÀO TRANG
window.onload = async function() {
  // Nạp sẵn giao diện màn hình Login
  const loginContainer = document.getElementById('screen-login');
  const loginRes = await fetch('pages/page_login.html');
  loginContainer.innerHTML = await loginRes.text();

  const isValid = await verifySystemAccess();
  if (isValid) {
    document.getElementById('screen-login').style.display = 'none';
    document.getElementById('screen-app').style.display = 'block';
    if(typeof renderTopbar === 'function') renderTopbar();
    switchPage('dashboard');
  } else {
    document.getElementById('screen-login').style.display = 'flex';
    document.getElementById('screen-app').style.display = 'none';
  }
};
