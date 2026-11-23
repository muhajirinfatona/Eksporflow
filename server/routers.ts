import { COOKIE_NAME } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { parsePoTextAndScreen } from "@shared/poScreening";
import { getLiveExchangeRates } from "./ratesService";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AuthFlowError,
  buildLocalAwareCookieOptions,
  getPendingDevOtpCode,
  loginWithEmailPassword,
  registerUserAccount,
  requestPasswordReset,
  resendVerificationChallenge,
  resetPasswordWithCode,
  verifyEmailCodeAndSignIn,
} from "./authService";
import { createShipment, deleteShipment, getShipment, listShipments, ShipmentPersistenceError, updateShipment } from "./shipmentDb";
import {
  archiveMasterBuyer,
  archiveMasterProduct,
  createMasterBuyer,
  createMasterProduct,
  createWorkspaceInvitation,
  deleteMasterBuyer,
  deleteMasterProduct,
  getMasterBuyer,
  getMasterProduct,
  listMasterBuyers,
  listMasterProducts,
  listWorkspaceInvitations,
  MasterDataError,
  revokeWorkspaceInvitation,
  updateMasterBuyer,
  updateMasterProduct,
} from "./masterDataDb";

import { createRateLimiter } from "./rateLimit";

const assistantRateLimiter = createRateLimiter({ limit: 20, windowMs: 60 * 60 * 1000 });
const authRateLimiter = createRateLimiter({ limit: 25, windowMs: 15 * 60 * 1000 });

const shipmentSnapshot = z.record(z.string(), z.unknown());
const shipmentLineItems = z.array(shipmentSnapshot).max(200);

function persistenceError(error: unknown): never {
  if (error instanceof ShipmentPersistenceError) {
    const code = error.code === "FORBIDDEN" ? "FORBIDDEN" : error.code === "NOT_FOUND" ? "NOT_FOUND" : error.code === "CONFLICT" ? "CONFLICT" : "INTERNAL_SERVER_ERROR";
    throw new TRPCError({ code, message: error.message });
  }
  console.error("shipment persistence failed", error);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Penyimpanan transaksi sedang tidak tersedia." });
}

function authError(error: unknown): never {
  if (error instanceof AuthFlowError) {
    const code =
      error.code === "BAD_REQUEST"
        ? "BAD_REQUEST"
        : error.code === "UNAUTHORIZED"
          ? "UNAUTHORIZED"
          : error.code === "FORBIDDEN"
            ? "FORBIDDEN"
            : error.code === "CONFLICT"
              ? "CONFLICT"
              : error.code === "TOO_MANY_REQUESTS"
                ? "TOO_MANY_REQUESTS"
                : "INTERNAL_SERVER_ERROR";
    throw new TRPCError({ code, message: error.message });
  }
  console.error("auth flow failed", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Layanan autentikasi sedang tidak tersedia. Pastikan koneksi database aktif.",
  });
}

function masterDataError(error: unknown): never {
  if (error instanceof MasterDataError) {
    const code =
      error.code === "FORBIDDEN"
        ? "FORBIDDEN"
        : error.code === "NOT_FOUND"
          ? "NOT_FOUND"
          : error.code === "CONFLICT"
            ? "CONFLICT"
            : error.code === "BAD_REQUEST"
              ? "BAD_REQUEST"
              : "INTERNAL_SERVER_ERROR";
    throw new TRPCError({ code, message: error.message });
  }
  console.error("master data failed", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Layanan data utama sedang tidak tersedia.",
  });
}

function checkAuthRateLimit(key: string) {
  const result = authRateLimiter.check(key);
  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Terlalu banyak percobaan. Silakan coba lagi dalam ${Math.ceil(result.retryAfterMs / 60_000)} menit.`,
    });
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter.").max(120),
          companyName: z.string().trim().min(2, "Nama perusahaan minimal 2 karakter.").max(160),
          email: z.string().trim().email("Format email tidak valid.").max(320),
          password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(128),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        checkAuthRateLimit(`register:${ctx.req.ip || "local"}`);
        try {
          return await registerUserAccount(input);
        } catch (error) {
          return authError(error);
        }
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Format email tidak valid.").max(320),
          password: z.string().min(1, "Kata sandi wajib diisi.").max(128),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        checkAuthRateLimit(`login:${input.email.toLowerCase()}`);
        try {
          return await loginWithEmailPassword(ctx.req, ctx.res, input);
        } catch (error) {
          return authError(error);
        }
      }),
    verifyEmail: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Format email tidak valid.").max(320),
          code: z.string().trim().min(6).max(12),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        checkAuthRateLimit(`verify:${input.email.toLowerCase()}`);
        try {
          return await verifyEmailCodeAndSignIn(ctx.req, ctx.res, input);
        } catch (error) {
          return authError(error);
        }
      }),
    resendVerification: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Format email tidak valid.").max(320),
        }),
      )
      .mutation(async ({ input }) => {
        checkAuthRateLimit(`resend:${input.email.toLowerCase()}`);
        try {
          return await resendVerificationChallenge(input);
        } catch (error) {
          return authError(error);
        }
      }),
    requestPasswordReset: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Format email tidak valid.").max(320),
        }),
      )
      .mutation(async ({ input }) => {
        checkAuthRateLimit(`reset-req:${input.email.toLowerCase()}`);
        try {
          return await requestPasswordReset(input);
        } catch (error) {
          return authError(error);
        }
      }),
    resetPasswordWithCode: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Format email tidak valid.").max(320),
          code: z.string().trim().min(6).max(12),
          newPassword: z.string().min(8, "Kata sandi minimal 8 karakter.").max(128),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        checkAuthRateLimit(`reset-exec:${input.email.toLowerCase()}`);
        try {
          return await resetPasswordWithCode(ctx.req, ctx.res, input);
        } catch (error) {
          return authError(error);
        }
      }),
    getDevOtpHint: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email("Format email tidak valid.").max(320),
        }),
      )
      .query(({ input }) => {
        if (process.env.NODE_ENV === "production" && process.env.RESEND_API_KEY) {
          return { devOtpCode: null };
        }
        return { devOtpCode: getPendingDevOtpCode(input.email) };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = buildLocalAwareCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  shipments: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(25), offset: z.number().int().min(0).default(0) }))
      .query(async ({ ctx, input }) => {
        try {
          return await listShipments(ctx.user.id, input);
        } catch (error) {
          return persistenceError(error);
        }
      }),
    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        try {
          return await getShipment(ctx.user.id, input.id);
        } catch (error) {
          return persistenceError(error);
        }
      }),
    create: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(1).max(80), status: z.string().trim().min(1).max(40).default("Draft"), snapshot: shipmentSnapshot, lineItems: shipmentLineItems }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await createShipment(ctx.user.id, input);
        } catch (error) {
          return persistenceError(error);
        }
      }),
    update: protectedProcedure
      .input(z.object({ id: z.string().uuid(), version: z.number().int().min(1), reference: z.string().trim().min(1).max(80), status: z.string().trim().min(1).max(40), snapshot: shipmentSnapshot, lineItems: shipmentLineItems }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await updateShipment(ctx.user.id, input);
        } catch (error) {
          return persistenceError(error);
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await deleteShipment(ctx.user.id, input.id);
        } catch (error) {
          return persistenceError(error);
        }
      }),
  }),

  assistant: router({
    // Wajib login dan dibatasi per user agar kuota LLM tidak bisa disalahgunakan.
    ask: protectedProcedure
      .input(z.object({ question: z.string().trim().min(2).max(2000), snapshot: z.string().max(8000) }))
      .mutation(async ({ ctx, input }) => {
        const limit = assistantRateLimiter.check(String(ctx.user.id));
        if (!limit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Batas pertanyaan Copilot tercapai. Coba lagi dalam ${Math.ceil(limit.retryAfterMs / 60_000)} menit.`,
          });
        }
        try {
          const result = await invokeLLM({
            model: "gpt-5-mini",
            maxTokens: 650,
            messages: [
              {
                role: "system",
                content: "Kamu adalah EksporFlow Copilot, asisten operasional ekspor untuk eksportir Indonesia. Jawab dalam bahasa Indonesia yang ringkas, praktis, dan berbasis konteks transaksi. Bantu menjelaskan incoterm, packing, dokumen, stuffing, dan risiko operasional. Jangan mengklaim dokumen legal valid secara final, jangan menjamin buyer/perusahaan asli, dan jangan menggantikan verifikasi bea cukai, bank, forwarder, atau penasihat hukum. Jika data kurang, sebutkan data yang perlu dilengkapi. Berikan langkah tindakan yang jelas dan prioritaskan risiko terbesar terlebih dahulu. Konteks transaksi akan dikirim dalam JSON berikut:\n" + input.snapshot,
              },
              { role: "user", content: input.question },
            ],
          });
          const content = result.choices?.[0]?.message?.content;
          if (typeof content !== "string" || !content.trim()) throw new Error("Asisten tidak menghasilkan jawaban.");
          // Log metadata saja (tanpa isi pertanyaan/snapshot) untuk audit biaya dan penyalahgunaan.
          console.info("assistant.ask", { userId: ctx.user.id, questionChars: input.question.length, model: result.model });
          return { answer: content.trim(), model: result.model };
        } catch (error) {
          console.error("assistant.ask failed", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Asisten AI sedang tidak tersedia. Coba lagi sebentar." });
        }
      }),

    screenPo: publicProcedure
      .input(
        z.object({
          poText: z.string().trim().min(5).max(12000),
          fileName: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return parsePoTextAndScreen(input.poText, input.fileName);
      }),
  }),

  rates: router({
    getLatest: publicProcedure
      .input(z.object({ forceRefresh: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return getLiveExchangeRates(Boolean(input?.forceRefresh));
      }),
  }),

  masterBuyers: router({
    list: protectedProcedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
            search: z.string().trim().max(100).optional(),
            includeArchived: z.boolean().default(false),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        try {
          return await listMasterBuyers(ctx.user.id, input);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        try {
          return await getMasterBuyer(ctx.user.id, input.id);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(2, "Nama buyer minimal 2 karakter.").max(200),
          country: z.string().trim().max(80).optional(),
          destination: z.string().trim().max(200).optional(),
          address: z.string().trim().max(1000).optional(),
          picName: z.string().trim().max(160).optional(),
          picEmail: z.string().trim().email().max(320).optional().or(z.literal("")),
          picPhone: z.string().trim().max(60).optional(),
          defaultPaymentTerms: z.string().trim().max(200).optional(),
          screeningStatus: z.string().trim().max(30).optional(),
          notes: z.string().trim().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await createMasterBuyer(ctx.user.id, input);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          version: z.number().int().min(1),
          name: z.string().trim().min(2).max(200),
          country: z.string().trim().max(80).optional(),
          destination: z.string().trim().max(200).optional(),
          address: z.string().trim().max(1000).optional(),
          picName: z.string().trim().max(160).optional(),
          picEmail: z.string().trim().email().max(320).optional().or(z.literal("")),
          picPhone: z.string().trim().max(60).optional(),
          defaultPaymentTerms: z.string().trim().max(200).optional(),
          screeningStatus: z.string().trim().max(30).optional(),
          notes: z.string().trim().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await updateMasterBuyer(ctx.user.id, input);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    archive: protectedProcedure
      .input(z.object({ id: z.string().uuid(), archive: z.boolean().default(true) }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await archiveMasterBuyer(ctx.user.id, input.id, input.archive);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await deleteMasterBuyer(ctx.user.id, input.id);
        } catch (error) {
          return masterDataError(error);
        }
      }),
  }),

  masterProducts: router({
    list: protectedProcedure
      .input(
        z
          .object({
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
            search: z.string().trim().max(100).optional(),
            commodityPreset: z.string().trim().max(40).optional(),
            includeArchived: z.boolean().default(false),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        try {
          return await listMasterProducts(ctx.user.id, input);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        try {
          return await getMasterProduct(ctx.user.id, input.id);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    create: protectedProcedure
      .input(
        z.object({
          sku: z.string().trim().max(80).optional(),
          name: z.string().trim().min(2, "Nama produk minimal 2 karakter.").max(200),
          commodityPreset: z.string().trim().max(40).optional(),
          hsCode: z.string().trim().max(20).optional(),
          unit: z.string().trim().max(30).default("carton"),
          unitPrice: z.number().min(0).default(0),
          currency: z.string().trim().max(3).default("USD"),
          packagingType: z.string().trim().max(60).default("Karton box"),
          unitWeightKg: z.number().min(0).default(0),
          lengthCm: z.number().min(0).default(0),
          widthCm: z.number().min(0).default(0),
          heightCm: z.number().min(0).default(0),
          shrinkageRatePct: z.number().min(0).max(100).default(0),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await createMasterProduct(ctx.user.id, input);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          version: z.number().int().min(1),
          sku: z.string().trim().max(80).optional(),
          name: z.string().trim().min(2).max(200),
          commodityPreset: z.string().trim().max(40).optional(),
          hsCode: z.string().trim().max(20).optional(),
          unit: z.string().trim().max(30).default("carton"),
          unitPrice: z.number().min(0).default(0),
          currency: z.string().trim().max(3).default("USD"),
          packagingType: z.string().trim().max(60).default("Karton box"),
          unitWeightKg: z.number().min(0).default(0),
          lengthCm: z.number().min(0).default(0),
          widthCm: z.number().min(0).default(0),
          heightCm: z.number().min(0).default(0),
          shrinkageRatePct: z.number().min(0).max(100).default(0),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await updateMasterProduct(ctx.user.id, input);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    archive: protectedProcedure
      .input(z.object({ id: z.string().uuid(), archive: z.boolean().default(true) }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await archiveMasterProduct(ctx.user.id, input.id, input.archive);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await deleteMasterProduct(ctx.user.id, input.id);
        } catch (error) {
          return masterDataError(error);
        }
      }),
  }),

  invitations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await listWorkspaceInvitations(ctx.user.id);
      } catch (error) {
        return masterDataError(error);
      }
    }),
    create: protectedProcedure
      .input(
        z.object({
          email: z.string().trim().email("Format email tidak valid.").max(320),
          role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await createWorkspaceInvitation(ctx.user.id, input);
        } catch (error) {
          return masterDataError(error);
        }
      }),
    revoke: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await revokeWorkspaceInvitation(ctx.user.id, input.id);
        } catch (error) {
          return masterDataError(error);
        }
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
