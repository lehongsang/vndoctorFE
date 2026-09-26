import { HealthProfile } from "@/store/api/health-profile/type";
import { calculateAge } from "@/lib/utils";

export const ExaminationInfo = ({ profile }: { profile: HealthProfile }) => {
   const age = calculateAge(profile.dob);

   return (
      <div className="px-5 py-4 rounded-lg border border-slate-300 shadow-sm cursor-pointer flex flex-col gap-4 bg-primary text-white border-none">
         <h2 className="text-lg font-bold">{profile.fullName}</h2>
         <div className="text-sm font-medium flex flex-col gap-2">
            <div className="flex items-center justify-between">
               <span>Mã BN:</span>
               <span>{profile.hospitalPatientCode || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1">
                  <span>Tuổi:</span>
                  <span>{age}</span>
               </div>
               <div className="flex items-center gap-1">
                  <span>Giới tính:</span>
                  <span>
                     {profile.gender === "MALE"
                        ? "Nam"
                        : profile.gender === "FEMALE"
                          ? "Nữ"
                          : "—"}
                  </span>
               </div>
            </div>
         </div>
      </div>
   );
};
