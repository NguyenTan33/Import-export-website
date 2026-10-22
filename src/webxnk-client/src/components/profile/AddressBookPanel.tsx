"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Check, LoaderCircle, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { addressBookApi, CustomerAddress, getApiErrorMessage, SaveCustomerAddressRequest } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";
import { Pagination } from "@/components/common/Pagination";

const emptyAddress = (): SaveCustomerAddressRequest => ({
  recipientName: "", phoneNumber: "", province: "", district: "", ward: "",
  addressLine: "", countryCode: "VNM", postalCode: "", isDefault: false,
});

export const AddressBookPanel: React.FC = () => {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SaveCustomerAddressRequest>(emptyAddress);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  const paginatedAddresses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return addresses.slice(start, start + pageSize);
  }, [addresses, page, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(await addressBookApi.getMine());
      setError("");
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, isVi ? "Không thể tải sổ địa chỉ." : "Could not load the address book."));
    } finally {
      setLoading(false);
    }
  }, [isVi]);

  useEffect(() => { void load(); }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyAddress(), isDefault: addresses.length === 0 });
    setError("");
    setModalOpen(true);
  };

  const startEdit = (address: CustomerAddress) => {
    setEditingId(address.id);
    setForm({
      recipientName: address.recipientName, phoneNumber: address.phoneNumber,
      province: address.province, district: address.district, ward: address.ward,
      addressLine: address.addressLine, countryCode: address.countryCode,
      postalCode: address.postalCode, isDefault: address.isDefault,
    });
    setError("");
    setModalOpen(true);
  };

  const setField = <K extends keyof SaveCustomerAddressRequest>(key: K, value: SaveCustomerAddressRequest[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId == null) await addressBookApi.create(form);
      else await addressBookApi.update(editingId, form);
      setModalOpen(false);
      await load();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, isVi ? "Không thể lưu địa chỉ." : "Could not save the address."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address: CustomerAddress) => {
    if (!window.confirm(isVi ? `Xóa địa chỉ của ${address.recipientName}?` : `Delete the address for ${address.recipientName}?`)) return;
    setError("");
    try {
      await addressBookApi.delete(address.id);
      await load();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, isVi ? "Không thể xóa địa chỉ." : "Could not delete the address."));
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="font-bold text-slate-900">{isVi ? "Sổ địa chỉ" : "Address book"}</h2>
          <p className="mt-1 text-sm text-slate-500">{isVi ? "Quản lý địa chỉ nhận hàng và địa chỉ mặc định." : "Manage delivery addresses and your default address."}</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#0E4B94] px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" />{isVi ? "Thêm địa chỉ" : "Add address"}</button>
      </div>
      {error && !modalOpen && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <div className="rounded-xl bg-white p-8 text-center text-slate-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />{isVi ? "Đang tải..." : "Loading..."}</div> : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{isVi ? "Bạn chưa lưu địa chỉ nào." : "You have no saved addresses."}</div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {paginatedAddresses.map((address, index) => (
              <article key={address.id ?? `address-${index}`} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-4 w-4 text-[#0E4B94]" />{address.recipientName}</div>
                  {address.isDefault && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"><Star className="h-3 w-3" />{isVi ? "Mặc định" : "Default"}</span>}
                </div>
                <p className="text-sm text-slate-600">{address.phoneNumber}</p>
                <p className="text-sm text-slate-700">{address.addressLine}, {address.ward}, {address.district}, {address.province}</p>
                <p className="text-xs text-slate-500">{address.countryCode}{address.postalCode ? ` · ${address.postalCode}` : ""}</p>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => startEdit(address)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" />{isVi ? "Sửa" : "Edit"}</button>
                  <button type="button" onClick={() => void handleDelete(address)} className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"><Trash2 className="h-3.5 w-3.5" />{isVi ? "Xóa" : "Delete"}</button>
                </div>
              </article>
            ))}
          </div>

          {addresses.length > 0 && (
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={addresses.length}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={[4, 6, 12]}
            />
          )}
        </>
      )}

      {modalOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
        <form onSubmit={handleSave} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b pb-3"><h3 className="font-bold">{editingId == null ? (isVi ? "Thêm địa chỉ" : "Add address") : (isVi ? "Sửa địa chỉ" : "Edit address")}</h3><button type="button" disabled={saving} onClick={() => setModalOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([["recipientName", isVi ? "Tên người nhận" : "Recipient name"], ["phoneNumber", isVi ? "Số điện thoại" : "Phone number"], ["province", isVi ? "Tỉnh/Thành phố" : "Province/City"], ["district", isVi ? "Quận/Huyện" : "District"], ["ward", isVi ? "Phường/Xã" : "Ward/Commune"], ["addressLine", isVi ? "Địa chỉ cụ thể" : "Street address"], ["countryCode", isVi ? "Mã quốc gia" : "Country code"], ["postalCode", isVi ? "Mã bưu chính" : "Postal code"]] as const).map(([key, label]) => (
              <label key={key} className="text-xs font-semibold text-slate-700">{label}<input required={!(["countryCode", "postalCode"] as string[]).includes(key)} maxLength={key === "addressLine" ? 300 : key === "recipientName" ? 150 : 100} value={form[key]} onChange={event => setField(key, event.target.value)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" /></label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isDefault} onChange={event => setField("isDefault", event.target.checked)} />{isVi ? "Đặt làm địa chỉ mặc định" : "Set as default address"}</label>
          {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t pt-3"><button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="rounded border border-slate-300 px-4 py-2 text-sm">{isVi ? "Hủy" : "Cancel"}</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded bg-[#0E4B94] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{isVi ? "Lưu địa chỉ" : "Save address"}</button></div>
        </form>
      </div>}
    </section>
  );
};
