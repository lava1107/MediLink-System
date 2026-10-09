import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "../../hooks/useApp.js";
import { createCategory, updateCategory, deleteCategory } from "../../services/categoryService.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import DataTable from "../../components/tables/DataTable.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Btn from "../../components/common/Btn.jsx";
import IconBtn from "../../components/common/IconBtn.jsx";
import Modal, { ConfirmDialog } from "../../components/common/Modal.jsx";
import { FormInput, FormSelect } from "../../components/common/FormControls.jsx";
import { formatDate } from "../../utils/format.js";

export default function CategoriesPage() {
  const { db, setDb, toast } = useApp();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  function openAdd() {
    setForm({ name: "", description: "", status: "Active" });
    setModal({ mode: "add" });
  }
  function openEdit(c) {
    setForm({ ...c });
    setModal({ mode: "edit", id: c.id });
  }

  async function save() {
    if (!form.name) {
      toast("Category name is required.", "error");
      return;
    }
    try {
      if (modal.mode === "add") {
        const created = await createCategory(form);
        setDb((d) => ({ ...d, categories: [...d.categories, created] }));
        toast("Category added.");
      } else {
        const updated = await updateCategory(modal.id, form);
        setDb((d) => ({ ...d, categories: d.categories.map((c) => (c.id === modal.id ? updated : c)) }));
        toast("Category updated.");
      }
      setModal(null);
    } catch (err) {
      toast(err.message || "Failed to save category.", "error");
    }
  }

  async function handleDelete() {
    if (!confirmDel) return;
    try {
      await deleteCategory(confirmDel.id);
      setDb((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== confirmDel.id) }));
      toast("Category deleted.");
      setConfirmDel(null);
    } catch (err) {
      toast(err.message || "Failed to delete category.", "error");
      setConfirmDel(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Category Management"
        subtitle="Organize medicines by category"
        crumbs={["MediLink", "Categories"]}
        action={
          <Btn icon={Plus} onClick={openAdd}>
            Add Category
          </Btn>
        }
      />
      <DataTable
        columns={[
          { key: "id", label: "Category ID", sortable: true },
          { key: "name", label: "Category Name", sortable: true },
          { key: "description", label: "Description" },
          { key: "count", label: "No. of Medicines", render: (r) => db.medicines.filter((m) => m.category === r.name).length },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "created", label: "Created Date", render: (r) => formatDate(r.created) },
        ]}
        data={db.categories}
        searchKeys={["name", "description"]}
        filters={[{ key: "status", label: "Status", options: ["Active", "Inactive"] }]}
        actions={(c) => (
          <>
            <IconBtn icon={Pencil} tone="blue" onClick={() => openEdit(c)} />
            <IconBtn icon={Trash2} tone="red" onClick={() => setConfirmDel(c)} />
          </>
        )}
      />
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Add Category" : "Edit Category"}
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={save}>Save</Btn>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormInput label="Category Name" required value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <FormInput label="Description" value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <FormSelect label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option>Active</option>
            <option>Inactive</option>
          </FormSelect>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        danger
        title="Delete category?"
        message={`Remove "${confirmDel?.name}" from categories?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
