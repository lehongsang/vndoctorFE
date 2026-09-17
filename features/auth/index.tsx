"use client";

import Image from "next/image";
import { LoginForm } from "./components/login-form";
import logoImage from "../../public/tmt/bg-login.png";
import logoNavi from "../../public/tmt/logo-navi.png";

export const LoginPage = () => {
   return (
      <div className="min-h-screen h-screen w-full overflow-hidden bg-[#EEF4FB] flex items-center justify-center p-3 sm:p-6 lg:p-8">
         <div className="w-full max-w-310 h-[92vh] max-h-190 bg-white rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,50,150,0.07)] border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            <div className="hidden md:flex w-full md:w-1/2 lg:w-[48%] h-full relative overflow-hidden bg-[#EAF2FC] flex-col justify-between p-7 lg:p-9 select-none">
               <Image
                  src={logoImage}
                  alt="VNDoctor Login Banner"
                  fill
                  priority
                  sizes="(max-width: 1024px) 50vw, 650px"
                  className="object-cover object-bottom select-none pointer-events-none"
               />

               <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="space-y-4 lg:space-y-10">
                     <Image
                        src={logoNavi}
                        alt="VNDoctor Logo"
                        width={180}
                        height={45}
                        priority
                        className="h-9 lg:h-10 w-auto object-contain"
                     />

                     <div className="space-y-2">
                        <h2 className="text-3xl lg:text-[33px] font-extrabold text-[#1E3A8A] leading-tight tracking-tight">
                           Nền tảng quản lý & chăm sóc
                           <br /> sức khỏe toàn diện.
                        </h2>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex-1 h-full flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white overflow-y-auto">
               <LoginForm />
            </div>
         </div>
      </div>
   );
};
