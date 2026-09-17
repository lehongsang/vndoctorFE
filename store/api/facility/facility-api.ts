import { baseApi } from "../base-api";
import {
   CreateFacilityRequestDto,
   Factility,
   GetChildrenF1FacilityQueryArgs,
   UpdateFacilityDto,
} from "./type";

const facilityApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      createFacility: builder.mutation<Factility, CreateFacilityRequestDto>({
         query: (body) => ({
            url: "/facilities",
            method: "POST",
            body,
         }),
         invalidatesTags: [{ type: "Facilities" }],
      }),
      getAllFacilities: builder.query<Factility[], void>({
         query: () => `/facilities`,
         providesTags: [{ type: "Facilities", id: "LIST" }],
      }),
      getDetailFacility: builder.query<Factility, string>({
         query: (id) => `/facilities/${id}`,
         providesTags: (id) => [{ type: "Facilities", id: `DETAIL_${id}` }],
      }),
      getChildrenF1Facility: builder.query<
         Factility[],
         GetChildrenF1FacilityQueryArgs
      >({
         query: (arg) => {
            if (typeof arg === "string") {
               return `/facilities/${arg}/children`;
            }
            const { id, search, page, limit, facilityType } = arg;
            const params: Record<string, string | number> = {};
            if (search) params.search = search;
            if (page !== undefined) params.page = page;
            if (limit !== undefined) params.limit = limit;
            if (facilityType) params.facilityType = facilityType;

            return {
               url: `/facilities/${id}/children`,
               params,
            };
         },
         providesTags: (_result, _error, arg) => {
            const id = typeof arg === "string" ? arg : arg.id;
            return [{ type: "Facilities", id: `CHILDREN_${id}` }];
         },
      }),
      getAllChildrenFacility: builder.query<Factility[], string>({
         query: (id) => `/facilities/hierarchy/tree/rootId=${id}`,
         providesTags: (id) => [
            { type: "Facilities", id: `CHILDREN_ALL_${id}` },
         ],
      }),
      updateFacility: builder.mutation<
         Factility,
         { id: string; body: UpdateFacilityDto }
      >({
         query: ({ id, body }) => ({
            url: `/facilities/${id}`,
            method: "PATCH",
            body,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: "Facilities" },
            { type: "Facilities", id: `DETAIL_${id}` },
         ],
      }),
   }),
});

export const {
   useCreateFacilityMutation,
   useGetAllFacilitiesQuery,
   useGetAllChildrenFacilityQuery,
   useGetChildrenF1FacilityQuery,
   useGetDetailFacilityQuery,
   useUpdateFacilityMutation,
} = facilityApi;
