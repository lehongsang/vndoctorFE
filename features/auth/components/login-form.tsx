"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/common/form-input";
import { CustomButton } from "@/components/common/custom-button";
import { useLoginMutation } from "@/store/api/auth/auth-api";
import { useAppDispatch } from "@/store/hooks";
import { setToken, setUser } from "@/store/slices/auth-slice";
import type { LoginErrorResponse } from "@/store/api/auth/type";

const loginSchema = z.object({
   username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
   password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
   const router = useRouter();
   const dispatch = useAppDispatch();
   const [login, { isLoading }] = useLoginMutation();

   const form = useForm<LoginFormValues>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
         username: "",
         password: "",
      },
   });

   const {
      register,
      handleSubmit,
      setError,
      formState: { errors, isSubmitting },
   } = form;

   const onSubmit = async (values: LoginFormValues) => {
      try {
         const response = await login(values).unwrap();
         localStorage.setItem("accessToken", response.accessToken);
         localStorage.setItem("refreshToken", response.refreshToken);
         localStorage.setItem("user", JSON.stringify(response.staff));
         dispatch(
            setToken({
               accessToken: response.accessToken,
               refreshToken: response.refreshToken,
            }),
         );
         dispatch(setUser(response.staff));
         router.replace("/");
      } catch (error) {
         const err = error as { data?: LoginErrorResponse; message?: string };
         const errorMessage =
            err.data?.message ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
         setError("root", {
            type: "server",
            message: errorMessage,
         });
      }
   };

   return (
      <div className="w-full max-w-98 mx-auto">
         <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
               Đăng nhập
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
               Chào mừng bạn quay trở lại VNDoctor
            </p>
         </div>

         <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
         >
            {errors.root?.message && (
               <div className="p-3 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <span>{errors.root.message}</span>
               </div>
            )}

            <FormInput
               {...register("username")}
               label="Tên đăng nhập"
               required
               placeholder="Nhập tên đăng nhập"
               error={errors.username?.message}
            />

            <div className="space-y-1.5">
               <FormInput
                  {...register("password")}
                  type="password"
                  label="Mật khẩu"
                  required
                  placeholder="Nhập mật khẩu"
                  error={errors.password?.message}
               />
               {/* <div className="flex justify-end pt-2">
                  <button
                     type="button"
                     onClick={() => {}}
                     className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                     Quên mật khẩu?
                  </button>
               </div> */}
            </div>

            <CustomButton
               type="submit"
               fullWidth
               isLoading={isLoading || isSubmitting}
               loadingText="Đang đăng nhập..."
            >
               Đăng nhập
            </CustomButton>
         </form>
      </div>
   );
};
