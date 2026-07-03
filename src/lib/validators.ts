import { z } from "zod";

export const customerSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  mobile: z.string().min(7, "Valid mobile required").max(15),
  address: z.string().optional().or(z.literal("")),
  village: z.string().optional().or(z.literal("")),
  taluk: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
});
export type CustomerInput = z.infer<typeof customerSchema>;

// One additional-charge line chosen on a bill.
export const billChargeLineSchema = z.object({
  chargeRateId: z.number().int().positive(),
  quantity: z.number().min(0).default(0),
});

export const createBillSchema = z.object({
  customerId: z.number().int().positive("Select a customer"),
  borewellTypeId: z.number().int().positive("Select a borewell type"),
  drillingDate: z.string().min(1, "Date is required"),
  totalDepth: z.number().int().positive("Enter depth in feet"),
  waterLevel: z.number().int().nonnegative().optional().nullable(),
  remarks: z.string().optional().or(z.literal("")),
  charges: z.array(billChargeLineSchema).default([]),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
});
export type CreateBillInput = z.infer<typeof createBillSchema>;

export const paymentSchema = z.object({
  jobId: z.number().int().positive(),
  amount: z.number().positive("Amount must be greater than 0"),
  paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  paymentDate: z.string().optional(),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const slabSchema = z.object({
  borewellTypeId: z.number().int().positive(),
  startDepth: z.number().int().positive(),
  endDepth: z.number().int().positive(),
  pricePerFt: z.number().positive(),
  reason: z.string().optional().or(z.literal("")),
}).refine((v) => v.endDepth >= v.startDepth, {
  message: "End depth must be ≥ start depth",
  path: ["endDepth"],
});
export type SlabInput = z.infer<typeof slabSchema>;

export const borewellTypeSchema = z.object({
  diameterName: z.string().min(1, "Diameter is required"),
  isActive: z.boolean().default(true),
});

export const chargeRateSchema = z.object({
  additionalChargeTypeId: z.number().int().positive(),
  borewellTypeId: z.number().int().positive(),
  price: z.number().positive(),
  unit: z.enum(["PER_FT", "PER_DAY", "PER_HOLE", "FIXED"]),
  isActive: z.boolean().default(true),
  reason: z.string().optional().or(z.literal("")),
});

export const chargeTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
});

export const userSchema = z.object({
  username: z.string().min(3, "Min 3 characters"),
  name: z.string().optional().or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "OPERATOR"]),
  password: z.string().min(6, "Min 6 characters").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const settingsSchema = z.object({
  companyName: z.string().min(1),
  address: z.string().optional().or(z.literal("")),
  gstNumber: z.string().optional().or(z.literal("")),
  contactNumber: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  footerText: z.string().optional().or(z.literal("")),
  currency: z.string().default("INR"),
  gstEnabled: z.boolean().default(false),
  defaultTaxRate: z.number().min(0).max(100).default(0),
  billPrefix: z.string().min(1).default("VB"),
});
