"use client";

import { useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomButton } from "@/components/common/custom-button";
import { FormInput } from "@/components/common/form-input";
import { FormTextarea } from "@/components/common/form-textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
   useGetTreatmentTargetTemplatesQuery,
   useCreateTreatmentTargetTemplateMutation,
   useUpdateTreatmentTargetTemplateMutation,
   useDeleteTreatmentTargetTemplateMutation,
} from "@/store/api/treatment-target-template/treatment-target-template-api";
import {
   TreatmentTargetTemplate,
   CreateTreatmentTargetTemplateInput,
} from "@/store/api/treatment-target-template/type";
import { TreatmentTarget } from "@/store/api/treatment-target/type";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "react-toastify";
import { SearchInput } from "@/components/common/search-input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COMMON_CUSTOM_TARGET_PRESETS = [
   { key: "uricAcid", label: "Acid Uric", defaultVal: "< 360 umol/L" },
   {
      key: "restingHeartRate",
      label: "Nhịp tim khi nghỉ",
      defaultVal: "60 - 75 bpm",
   },
   { key: "triglyceride", label: "Triglyceride", defaultVal: "< 1.7 mmol/L" },
   { key: "microalbumin", label: "Microalbumin niệu", defaultVal: "< 30 mg/g" },
];

const parseCustomTargets = (
   raw?: Record<string, string> | { [key: string]: string }[] | null,
): { id: string; key: string; value: string }[] => {
   if (!raw) return [];
   return Array.isArray(raw)
      ? raw.flatMap((item, idx) =>
           item && typeof item === "object"
              ? Object.entries(item).map(([k, v]) => ({
                   id: `ct-${idx}-${k}`,
                   key: k,
                   value: String(v ?? ""),
                }))
              : [],
        )
      : Object.entries(raw).map(([k, v], idx) => ({
           id: `ct-${idx}-${k}`,
           key: k,
           value: String(v ?? ""),
        }));
};

interface TreatmentTargetTemplateModalProps {
   isOpen: boolean;
   onClose: () => void;
   onApplyTemplate: (template: TreatmentTargetTemplate) => void;
   currentTargetData?: TreatmentTarget | null;
   customTargets?: Record<string, string>;
   dictionaryCode?: string;
   initialMode?: "list" | "create";
}

export function TreatmentTargetTemplateModal({
   isOpen,
   onClose,
   onApplyTemplate,
   currentTargetData,
   customTargets = {},
   dictionaryCode = "",
   initialMode = "list",
}: TreatmentTargetTemplateModalProps) {
   const { user } = useAuth();
   const [search, setSearch] = useState("");
   const [mode, setMode] = useState<"list" | "create" | "edit">(initialMode);
   const [editingTemplate, setEditingTemplate] =
      useState<TreatmentTargetTemplate | null>(null);

   const [createTemplate, { isLoading: isCreating }] =
      useCreateTreatmentTargetTemplateMutation();
   const [updateTemplate, { isLoading: isUpdating }] =
      useUpdateTreatmentTargetTemplateMutation();
   const [deleteTemplate, { isLoading: isDeleting }] =
      useDeleteTreatmentTargetTemplateMutation();

   // Query templates
   const {
      data: templateResponse,
      isLoading,
      refetch,
   } = useGetTreatmentTargetTemplatesQuery({
      search: search.trim() || undefined,
      limit: 100,
   });

   // Form state for create/edit - khởi tạo từ currentTargetData nếu initialMode === "create"
   const [formName, setFormName] = useState("");
   const [formDescription, setFormDescription] = useState("");
   const [formBpTarget, setFormBpTarget] = useState(() =>
      initialMode === "create" ? currentTargetData?.bpTarget || "" : "",
   );
   const [formLipidTarget, setFormLipidTarget] = useState(() =>
      initialMode === "create" ? currentTargetData?.lipidTarget || "" : "",
   );
   const [formBmiTarget, setFormBmiTarget] = useState(() =>
      initialMode === "create" ? currentTargetData?.bmiTarget || "" : "",
   );
   const [formGlycemicTarget, setFormGlycemicTarget] = useState(() =>
      initialMode === "create" ? currentTargetData?.glycemicTarget || "" : "",
   );
   const [formRenalTarget, setFormRenalTarget] = useState(() =>
      initialMode === "create" ? currentTargetData?.renalTarget || "" : "",
   );
   const [formDietAdvice, setFormDietAdvice] = useState(() =>
      initialMode === "create" ? currentTargetData?.dietAdvice || "" : "",
   );
   const [formExerciseAdvice, setFormExerciseAdvice] = useState(() =>
      initialMode === "create" ? currentTargetData?.exerciseAdvice || "" : "",
   );
   const [formSmokingAdvice, setFormSmokingAdvice] = useState(() =>
      initialMode === "create" ? currentTargetData?.smokingAdvice || "" : "",
   );
   const [formDoctorNotes, setFormDoctorNotes] = useState(() =>
      initialMode === "create" ? currentTargetData?.doctorNotes || "" : "",
   );
   const [formIsPublic, setFormIsPublic] = useState(false);
   const [customTargetList, setCustomTargetList] = useState<
      { id: string; key: string; value: string }[]
   >(() =>
      initialMode === "create"
         ? parseCustomTargets(currentTargetData?.customTargets || customTargets)
         : [],
   );

   const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
   const [prevInitialMode, setPrevInitialMode] = useState(initialMode);

   const getCustomTargetsObject = (): Record<string, string> => {
      const res: Record<string, string> = {};
      customTargetList.forEach((item) => {
         const k = item.key.trim();
         if (k) {
            res[k] = item.value.trim();
         }
      });
      return res;
   };

   const handleAddCustomTarget = () => {
      setCustomTargetList((prev) => [
         ...prev,
         {
            id: `ct-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            key: "",
            value: "",
         },
      ]);
   };

   const handleUpdateCustomTarget = (
      id: string,
      field: "key" | "value",
      val: string,
   ) => {
      setCustomTargetList((prev) =>
         prev.map((item) =>
            item.id === id ? { ...item, [field]: val } : item,
         ),
      );
   };

   const handleRemoveCustomTarget = (id: string) => {
      setCustomTargetList((prev) => prev.filter((item) => item.id !== id));
   };

   const resetForm = () => {
      setFormName("");
      setFormDescription("");
      setFormBpTarget("");
      setFormLipidTarget("");
      setFormBmiTarget("");
      setFormGlycemicTarget("");
      setFormRenalTarget("");
      setFormDietAdvice("");
      setFormExerciseAdvice("");
      setFormSmokingAdvice("");
      setFormDoctorNotes("");
      setFormIsPublic(false);
      setCustomTargetList([]);
      setEditingTemplate(null);
   };

   // Chuẩn bị mở form tạo mới từ dữ liệu hiện tại trong phiếu khám
   const handleOpenCreateFromCurrent = () => {
      resetForm();
      if (currentTargetData) {
         setFormBpTarget(currentTargetData.bpTarget || "");
         setFormLipidTarget(currentTargetData.lipidTarget || "");
         setFormBmiTarget(currentTargetData.bmiTarget || "");
         setFormGlycemicTarget(currentTargetData.glycemicTarget || "");
         setFormRenalTarget(currentTargetData.renalTarget || "");
         setFormDietAdvice(currentTargetData.dietAdvice || "");
         setFormExerciseAdvice(currentTargetData.exerciseAdvice || "");
         setFormSmokingAdvice(currentTargetData.smokingAdvice || "");
         setFormDoctorNotes(currentTargetData.doctorNotes || "");
         setCustomTargetList(
            parseCustomTargets(
               currentTargetData.customTargets || customTargets,
            ),
         );
      } else if (customTargets) {
         setCustomTargetList(parseCustomTargets(customTargets));
      }
      setMode("create");
   };

   const handleOpenCreateBlank = () => {
      resetForm();
      setMode("create");
   };

   // Điều chỉnh state khi modal mở lại hoặc initialMode thay đổi (React Recommended pattern: Storing information from previous renders)
   if (isOpen !== prevIsOpen || initialMode !== prevInitialMode) {
      setPrevIsOpen(isOpen);
      setPrevInitialMode(initialMode);
      if (isOpen) {
         if (initialMode === "create") {
            setMode("create");
            setFormName("");
            setFormDescription("");
            setFormBpTarget(currentTargetData?.bpTarget || "");
            setFormLipidTarget(currentTargetData?.lipidTarget || "");
            setFormBmiTarget(currentTargetData?.bmiTarget || "");
            setFormGlycemicTarget(currentTargetData?.glycemicTarget || "");
            setFormRenalTarget(currentTargetData?.renalTarget || "");
            setFormDietAdvice(currentTargetData?.dietAdvice || "");
            setFormExerciseAdvice(currentTargetData?.exerciseAdvice || "");
            setFormSmokingAdvice(currentTargetData?.smokingAdvice || "");
            setFormDoctorNotes(currentTargetData?.doctorNotes || "");
            setFormIsPublic(false);
            setCustomTargetList(
               parseCustomTargets(
                  currentTargetData?.customTargets || customTargets,
               ),
            );
            setEditingTemplate(null);
         } else {
            setMode("list");
            setFormName("");
            setFormDescription("");
            setFormBpTarget("");
            setFormLipidTarget("");
            setFormBmiTarget("");
            setFormGlycemicTarget("");
            setFormRenalTarget("");
            setFormDietAdvice("");
            setFormExerciseAdvice("");
            setFormSmokingAdvice("");
            setFormDoctorNotes("");
            setFormIsPublic(false);
            setCustomTargetList([]);
            setEditingTemplate(null);
         }
      }
   }

   const handleOpenEdit = (tpl: TreatmentTargetTemplate) => {
      setEditingTemplate(tpl);
      setFormName(tpl.name || "");
      setFormDescription(tpl.description || "");
      setFormBpTarget(tpl.bpTarget || "");
      setFormLipidTarget(tpl.lipidTarget || "");
      setFormBmiTarget(tpl.bmiTarget || "");
      setFormGlycemicTarget(tpl.glycemicTarget || "");
      setFormRenalTarget(tpl.renalTarget || "");
      setFormDietAdvice(tpl.dietAdvice || "");
      setFormExerciseAdvice(tpl.exerciseAdvice || "");
      setFormSmokingAdvice(tpl.smokingAdvice || "");
      setFormDoctorNotes(tpl.doctorNotes || "");
      setFormIsPublic(false);
      setCustomTargetList(parseCustomTargets(tpl.customTargets));
      setMode("edit");
   };

   const handleSubmitForm = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName.trim()) {
         toast.warning("Vui lòng nhập tên mẫu mục tiêu điều trị");
         return;
      }

      const facilityId = user?.facilityId || user?.facility?.id || "";

      try {
         const customTargetsMap = getCustomTargetsObject();

         if (mode === "create") {
            const body: CreateTreatmentTargetTemplateInput = {
               name: formName.trim(),
               description: formDescription.trim(),
               facilityId,
               dictionaryCode: dictionaryCode || "DEFAULT",
               bpTarget: formBpTarget,
               lipidTarget: formLipidTarget,
               bmiTarget: formBmiTarget,
               glycemicTarget: formGlycemicTarget,
               renalTarget: formRenalTarget,
               dietAdvice: formDietAdvice,
               exerciseAdvice: formExerciseAdvice,
               smokingAdvice: formSmokingAdvice,
               customTargets: customTargetsMap,
               doctorNotes: formDoctorNotes,
               isPublic: formIsPublic,
            };

            await createTemplate(body).unwrap();
            toast.success("Thêm mới mẫu mục tiêu thành công!");
         } else if (mode === "edit" && editingTemplate) {
            await updateTemplate({
               id: editingTemplate.id,
               name: formName.trim(),
               description: formDescription.trim(),
               bpTarget: formBpTarget,
               lipidTarget: formLipidTarget,
               bmiTarget: formBmiTarget,
               glycemicTarget: formGlycemicTarget,
               renalTarget: formRenalTarget,
               dietAdvice: formDietAdvice,
               exerciseAdvice: formExerciseAdvice,
               smokingAdvice: formSmokingAdvice,
               customTargets: customTargetsMap,
               doctorNotes: formDoctorNotes,
            }).unwrap();
            toast.success("Cập nhật mẫu mục tiêu thành công!");
         }

         refetch();
         setMode("list");
         resetForm();
      } catch (error: unknown) {
         const err = error as { data?: { message?: string } };
         toast.error(err?.data?.message || "Thao tác mẫu mục tiêu thất bại.");
      }
   };

   const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm("Bạn có chắc chắn muốn xóa mẫu mục tiêu này?"))
         return;

      try {
         await deleteTemplate(id).unwrap();
         toast.success("Xóa mẫu thành công!");
         refetch();
      } catch (error: unknown) {
         const err = error as { data?: { message?: string } };
         toast.error(err?.data?.message || "Xóa mẫu thất bại.");
      }
   };

   const templates = templateResponse?.data || [];

   return (
      <Dialog
         open={isOpen}
         onOpenChange={(open) => {
            if (!open) {
               setMode("list");
               resetForm();
               onClose();
            }
         }}
      >
         <DialogContent className="sm:min-w-3xl max-h-[90vh] flex flex-col p-6 rounded-sm">
            <DialogHeader className="shrink-0 pr-8">
               {mode === "list" ? (
                  <DialogTitle className="text-base font-bold text-slate-800">
                     Mẫu mục tiêu điều trị
                  </DialogTitle>
               ) : (
                  <div className="flex items-center gap-2">
                     <button
                        type="button"
                        onClick={() => {
                           setMode("list");
                           resetForm();
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-primary transition-colors cursor-pointer py-1 px-2 -ml-2 rounded hover:bg-slate-100"
                        title="Quay lại danh sách"
                     >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Quay lại</span>
                     </button>
                     <div className="h-4 w-px bg-slate-200" />
                     <DialogTitle className="text-base font-bold text-slate-800">
                        {mode === "create"
                           ? "Tạo mẫu mục tiêu điều trị mới"
                           : "Chỉnh sửa mẫu mục tiêu"}
                     </DialogTitle>
                  </div>
               )}
               <DialogDescription className="text-xs text-slate-500 mt-1">
                  {mode === "list"
                     ? "Chọn mẫu mục tiêu điều trị để tự động điền nhanh các chỉ số và lời khuyên vào phiếu khám."
                     : "Nhập thông tin mục tiêu điều trị để lưu vào danh mục mẫu sử dụng lại."}
               </DialogDescription>
            </DialogHeader>

            {mode === "list" ? (
               <div className="flex flex-col gap-3 flex-1 overflow-hidden p-1">
                  {/* Toolbar hành động & tìm kiếm */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                     <div className="flex-1 min-w-50">
                        <SearchInput
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           placeholder="Tìm kiếm mẫu theo tên, mô tả..."
                        />
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                        {currentTargetData && (
                           <CustomButton
                              type="button"
                              size="sm"
                              onClick={handleOpenCreateFromCurrent}
                              className="h-9 px-3 text-xs"
                           >
                              Lưu từ mục tiêu hiện tại
                           </CustomButton>
                        )}
                        <CustomButton
                           type="button"
                           size="sm"
                           onClick={handleOpenCreateBlank}
                           className="h-9 px-3 text-xs cursor-pointer"
                        >
                           <Plus className="w-3.5 h-3.5 mr-1.5" />
                           Thêm mẫu mới
                        </CustomButton>
                     </div>
                  </div>

                  <ScrollArea className="h-[65vh] -mr-4 pr-4">
                     {isLoading ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                           Đang tải danh sách mẫu...
                        </div>
                     ) : templates.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                           <p className="text-xs text-slate-500">
                              Chưa có mẫu mục tiêu điều trị nào phù hợp.
                           </p>
                           <CustomButton
                              size="sm"
                              onClick={handleOpenCreateBlank}
                              className="text-xs h-7 mt-1"
                           >
                              Tạo mẫu đầu tiên
                           </CustomButton>
                        </div>
                     ) : (
                        <div className="space-y-2">
                           {templates.map((tpl) => (
                              <div
                                 key={tpl.id}
                                 className="p-3 rounded-sm border border-slate-200 hover:border-primary/50 hover:bg-slate-50/60 transition-all flex flex-col gap-2 group relative"
                              >
                                 <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                                       {tpl.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                       <CustomButton
                                          type="button"
                                          variant="ghost"
                                          onClick={() => handleOpenEdit(tpl)}
                                          className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors underline"
                                       >
                                          Sửa
                                       </CustomButton>
                                       <CustomButton
                                          type="button"
                                          variant="ghost"
                                          disabled={isDeleting}
                                          onClick={(e) =>
                                             handleDeleteTemplate(tpl.id, e)
                                          }
                                          className="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors underline"
                                       >
                                          Xóa
                                       </CustomButton>
                                       <CustomButton
                                          type="button"
                                          size="sm"
                                          onClick={() => {
                                             onApplyTemplate(tpl);
                                             onClose();
                                          }}
                                          className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-white ml-1"
                                       >
                                          Áp dụng
                                       </CustomButton>
                                    </div>
                                 </div>

                                 {/* Tóm tắt các chỉ số trong mẫu */}
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                                    {tpl.bpTarget && (
                                       <div>
                                          <span className="text-slate-400">
                                             H/áp:{" "}
                                          </span>
                                          <span className="font-medium text-slate-800">
                                             {tpl.bpTarget}
                                          </span>
                                       </div>
                                    )}
                                    {tpl.lipidTarget && (
                                       <div>
                                          <span className="text-slate-400">
                                             Lipid:{" "}
                                          </span>
                                          <span className="font-medium text-slate-800">
                                             {tpl.lipidTarget}
                                          </span>
                                       </div>
                                    )}
                                    {tpl.glycemicTarget && (
                                       <div>
                                          <span className="text-slate-400">
                                             Đường huyết:{" "}
                                          </span>
                                          <span className="font-medium text-slate-800">
                                             {tpl.glycemicTarget}
                                          </span>
                                       </div>
                                    )}
                                    {tpl.bmiTarget && (
                                       <div>
                                          <span className="text-slate-400">
                                             BMI:{" "}
                                          </span>
                                          <span className="font-medium text-slate-800">
                                             {tpl.bmiTarget}
                                          </span>
                                       </div>
                                    )}
                                    {tpl.renalTarget && (
                                       <div>
                                          <span className="text-slate-400">
                                             Thận:{" "}
                                          </span>
                                          <span className="font-medium text-slate-800">
                                             {tpl.renalTarget}
                                          </span>
                                       </div>
                                    )}
                                    {tpl.customTargets &&
                                       typeof tpl.customTargets === "object" &&
                                       Object.entries(tpl.customTargets).map(
                                          ([k, v]) => (
                                             <div key={k}>
                                                <span className="text-slate-400">
                                                   {k}:{" "}
                                                </span>
                                                <span className="font-medium text-slate-800">
                                                   {v}
                                                </span>
                                             </div>
                                          ),
                                       )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </ScrollArea>
               </div>
            ) : (
               <form
                  onSubmit={handleSubmitForm}
                  className="flex flex-col flex-1 overflow-hidden mt-2"
               >
                  <ScrollArea className="h-[60vh] -mr-3 pr-3">
                     <div className="space-y-3 pb-2 p-2 shadow-sm bg-white">
                        <div className="grid grid-cols-1 gap-3">
                           <FormInput
                              label="Tên mẫu mục tiêu"
                              required
                              placeholder="VD: Mục tiêu Tăng Huyết Áp độ 2, ĐTĐ Type 2..."
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                           />
                           <FormInput
                              label="Mô tả ngắn"
                              placeholder="VD: Dành cho bệnh nhân nguy cơ tim mạch rất cao..."
                              value={formDescription}
                              onChange={(e) =>
                                 setFormDescription(e.target.value)
                              }
                           />
                        </div>

                        <div className="text-xs font-bold text-slate-800">
                           Chỉ số mục tiêu
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                           <FormInput
                              label="Huyết áp"
                              placeholder="VD: < 130/80 mmHg"
                              value={formBpTarget}
                              onChange={(e) => setFormBpTarget(e.target.value)}
                           />
                           <FormInput
                              label="Lipid máu"
                              placeholder="VD: LDL-C < 1.4 mmol/L"
                              value={formLipidTarget}
                              onChange={(e) =>
                                 setFormLipidTarget(e.target.value)
                              }
                           />
                           <FormInput
                              label="BMI"
                              placeholder="VD: 18.5 - 22.9 kg/m²"
                              value={formBmiTarget}
                              onChange={(e) => setFormBmiTarget(e.target.value)}
                           />
                           <FormInput
                              label="Đường huyết"
                              placeholder="VD: HbA1c < 7.0%"
                              value={formGlycemicTarget}
                              onChange={(e) =>
                                 setFormGlycemicTarget(e.target.value)
                              }
                           />
                           <FormInput
                              label="Chức năng thận"
                              placeholder="VD: eGFR > 60 mL/min"
                              value={formRenalTarget}
                              onChange={(e) =>
                                 setFormRenalTarget(e.target.value)
                              }
                           />
                        </div>

                        {/* Mục tiêu điều trị tùy chỉnh / bổ sung */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                           <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-slate-800">
                                 Mục tiêu tùy chỉnh / bổ sung
                              </div>
                           </div>

                           {/* Gợi ý nhanh */}
                           <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="text-[11px] text-slate-400">
                                 Gợi ý nhanh:
                              </span>
                              {COMMON_CUSTOM_TARGET_PRESETS.map((preset) => {
                                 const isAdded = customTargetList.some(
                                    (t) =>
                                       t.key.toLowerCase() ===
                                       preset.key.toLowerCase(),
                                 );
                                 return (
                                    <button
                                       key={preset.key}
                                       type="button"
                                       disabled={isAdded}
                                       onClick={() => {
                                          setCustomTargetList((prev) => [
                                             ...prev,
                                             {
                                                id: `ct-${Date.now()}-${preset.key}`,
                                                key: preset.key,
                                                value: preset.defaultVal,
                                             },
                                          ]);
                                       }}
                                       className={cn(
                                          "text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer",
                                          isAdded
                                             ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                             : "bg-white text-slate-600 hover:text-primary-600 hover:border-primary-300 border-slate-200 shadow-2xs",
                                       )}
                                    >
                                       + {preset.label}
                                    </button>
                                 );
                              })}
                           </div>

                           {/* Danh sách mục tiêu tùy chỉnh đã thêm */}
                           {customTargetList.length > 0 && (
                              <div className="space-y-2 mt-2">
                                 {customTargetList.map((item, idx) => (
                                    <div
                                       key={item.id}
                                       className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                                    >
                                       <div className="flex-1 w-full sm:w-auto">
                                          <FormInput
                                             label={
                                                idx === 0
                                                   ? "Tên / Mã chỉ số"
                                                   : undefined
                                             }
                                             placeholder="VD: uricAcid, Acid Uric..."
                                             value={item.key}
                                             onChange={(e) =>
                                                handleUpdateCustomTarget(
                                                   item.id,
                                                   "key",
                                                   e.target.value,
                                                )
                                             }
                                             containerClassName="w-full"
                                          />
                                       </div>
                                       <div className="flex-1 w-full sm:w-auto">
                                          <FormInput
                                             label={
                                                idx === 0
                                                   ? "Mục tiêu cần đạt"
                                                   : undefined
                                             }
                                             placeholder="VD: < 360 umol/L"
                                             value={item.value}
                                             onChange={(e) =>
                                                handleUpdateCustomTarget(
                                                   item.id,
                                                   "value",
                                                   e.target.value,
                                                )
                                             }
                                             containerClassName="w-full"
                                          />
                                       </div>
                                       <button
                                          type="button"
                                          onClick={() =>
                                             handleRemoveCustomTarget(item.id)
                                          }
                                          className={cn(
                                             "p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors self-end sm:self-center cursor-pointer",
                                             idx === 0 && "sm:mt-5",
                                          )}
                                          title="Xóa mục tiêu này"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                 ))}
                              </div>
                           )}
                           <div className="flex justify-center">
                              <CustomButton
                                 type="button"
                                 size="sm"
                                 onClick={handleAddCustomTarget}
                                 className="text-xs h-8 px-2"
                              >
                                 <Plus className="w-3.5 h-3.5 mr-1" />
                                 Thêm mục tiêu
                              </CustomButton>
                           </div>
                        </div>

                        <div className="text-xs font-bold text-slate-800">
                           Lời khuyên & Tư vấn
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                           <FormTextarea
                              label="Tư vấn chế độ ăn"
                              placeholder="Chế độ ăn giảm muối, hạn chế dầu mỡ..."
                              value={formDietAdvice}
                              onChange={(e) =>
                                 setFormDietAdvice(e.target.value)
                              }
                              rows={2}
                           />
                           <FormTextarea
                              label="Tư vấn vận động"
                              placeholder="Đi bộ 30 phút/ngày..."
                              value={formExerciseAdvice}
                              onChange={(e) =>
                                 setFormExerciseAdvice(e.target.value)
                              }
                              rows={2}
                           />
                           <FormTextarea
                              label="Tư vấn cai thuốc lá"
                              placeholder="Cai thuốc lá hoàn toàn..."
                              value={formSmokingAdvice}
                              onChange={(e) =>
                                 setFormSmokingAdvice(e.target.value)
                              }
                              rows={2}
                           />
                        </div>

                        <FormTextarea
                           label="Ghi chú của bác sĩ"
                           placeholder="Ghi chú thêm..."
                           value={formDoctorNotes}
                           onChange={(e) => setFormDoctorNotes(e.target.value)}
                           rows={2}
                        />

                        {mode === "create" && (
                           <div className="flex items-center gap-2 pt-1">
                              <Checkbox
                                 id="isPublic"
                                 checked={formIsPublic}
                                 onCheckedChange={(checked) =>
                                    setFormIsPublic(Boolean(checked))
                                 }
                              />
                              <Label
                                 htmlFor="isPublic"
                                 className="text-xs text-slate-700 cursor-pointer"
                              >
                                 Chia sẻ mẫu này cho toàn cơ sở (Public)
                              </Label>
                           </div>
                        )}
                     </div>
                  </ScrollArea>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                     <CustomButton
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                           setMode("list");
                           resetForm();
                        }}
                        className="h-8 w-20 text-xs"
                     >
                        Hủy
                     </CustomButton>
                     <CustomButton
                        type="submit"
                        size="sm"
                        isLoading={isCreating || isUpdating}
                        className="h-8 w-32 text-xs"
                     >
                        {mode === "create" ? "Tạo mẫu mới" : "Lưu thay đổi"}
                     </CustomButton>
                  </div>
               </form>
            )}
         </DialogContent>
      </Dialog>
   );
}
