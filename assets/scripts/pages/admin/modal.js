let modalRoot;

function ensureRoot() {
  if (modalRoot) return modalRoot;
  modalRoot = document.createElement("div");
  modalRoot.className = "modal-root";
  modalRoot.innerHTML = `<div class="modal-card" id="admin-modal-card"></div>`;
  modalRoot.addEventListener("click", (event) => {
    if (event.target === modalRoot) closeModal();
  });
  document.body.appendChild(modalRoot);
  return modalRoot;
}

export function openModal({
  title,
  description = "",
  body = "",
  confirmText = "确定",
  cancelText = "取消",
  danger = false,
  onConfirm
}) {
  const root = ensureRoot();
  const card = document.getElementById("admin-modal-card");
  card.innerHTML = `
    <h3>${title}</h3>
    <p>${description}</p>
    <div>${body}</div>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="admin-modal-cancel">${cancelText}</button>
      <button class="btn ${danger ? "btn-danger" : "btn-primary"}" id="admin-modal-confirm">${confirmText}</button>
    </div>
  `;
  root.classList.add("visible");
  document.getElementById("admin-modal-cancel").onclick = closeModal;
  document.getElementById("admin-modal-confirm").onclick = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    closeModal();
  };
}

export function closeModal() {
  if (modalRoot) {
    modalRoot.classList.remove("visible");
  }
}
