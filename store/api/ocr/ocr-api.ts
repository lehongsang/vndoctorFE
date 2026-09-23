import { baseApi } from "../base-api";
import {
   OcrPdfRequest,
   OcrPdfResponse,
   OcrCccdRequest,
   OcrCccdResponse,
   OcrHealthResponse,
} from "./type";

export const ocrApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      // 1. OCR & Trích xuất Hồ sơ Bệnh án từ PDF hoặc Hình ảnh
      extractOcrPdf: builder.mutation<OcrPdfResponse, FormData | OcrPdfRequest>({
         query: (arg) => {
            if (arg instanceof FormData) {
               return {
                  url: "/ocr/pdf",
                  method: "POST",
                  body: arg,
               };
            }

            const formData = new FormData();
            formData.append("file", arg.file);
            if (arg.force_ocr !== undefined) {
               formData.append("force_ocr", String(arg.force_ocr));
            }
            if (arg.dpi !== undefined) {
               formData.append("dpi", String(arg.dpi));
            }
            if (arg.lang) {
               formData.append("lang", arg.lang);
            }
            if (arg.engine) {
               formData.append("engine", arg.engine);
            }

            return {
               url: "/ocr/pdf",
               method: "POST",
               body: formData,
            };
         },
         invalidatesTags: ["Ocr"],
      }),

      // 2. OCR Căn cước công dân (CCCD 2 mặt)
      extractOcrCccd: builder.mutation<
         OcrCccdResponse,
         FormData | OcrCccdRequest
      >({
         query: (arg) => {
            if (arg instanceof FormData) {
               return {
                  url: "/ocr/cccd",
                  method: "POST",
                  body: arg,
               };
            }

            const formData = new FormData();
            if (arg.front_file) {
               formData.append("front_file", arg.front_file);
            }
            if (arg.back_file) {
               formData.append("back_file", arg.back_file);
            }
            if (arg.note) {
               formData.append("note", arg.note);
            }

            return {
               url: "/ocr/cccd",
               method: "POST",
               body: formData,
            };
         },
         invalidatesTags: ["Ocr"],
      }),

      // 3. Kiểm tra trạng thái kết nối tới máy chủ OCR
      getOcrHealth: builder.query<OcrHealthResponse, void>({
         query: () => ({
            url: "/ocr/health",
            method: "GET",
         }),
         providesTags: ["Ocr"],
      }),
   }),
   overrideExisting: true,
});

export const {
   useExtractOcrPdfMutation,
   useExtractOcrCccdMutation,
   useGetOcrHealthQuery,
   useLazyGetOcrHealthQuery,
} = ocrApi;
