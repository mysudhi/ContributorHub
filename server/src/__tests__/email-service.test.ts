import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("nodemailer", () => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test-msg-id" });
  const verifyMock = vi.fn().mockResolvedValue(true);
  return {
    default: {
      createTransport: vi.fn(() => ({
        sendMail: sendMailMock,
        verify: verifyMock,
      })),
    },
  };
});

import nodemailer from "nodemailer";
import {
  initEmailService,
  sendEmail,
  verifyConnection,
  getEmailEnabled,
  _resetForTesting,
} from "../email/email-service.js";

describe("Email Service", () => {
  beforeEach(() => {
    _resetForTesting();
    vi.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  describe("initEmailService", () => {
    it("disables email when SMTP_HOST is not set", () => {
      initEmailService();
      expect(getEmailEnabled()).toBe(false);
    });

    it("enables email when SMTP_HOST is provided", () => {
      initEmailService({ host: "smtp.example.com" });
      expect(getEmailEnabled()).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });

    it("reads config from environment variables", () => {
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_SECURE = "true";
      process.env.SMTP_USER = "user@test.com";
      process.env.SMTP_PASS = "secret";

      initEmailService();
      expect(getEmailEnabled()).toBe(true);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.test.com",
        port: 465,
        secure: true,
        auth: { user: "user@test.com", pass: "secret" },
      });
    });

    it("does not include auth if user/pass not set", () => {
      initEmailService({ host: "smtp.noauth.com", port: 25 });
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.noauth.com",
        port: 25,
        secure: false,
      });
    });
  });

  describe("sendEmail", () => {
    it("returns false when email is disabled", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
      });
      expect(result).toBe(false);
    });

    it("sends email when service is enabled", async () => {
      initEmailService({ host: "smtp.example.com" });

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Hello World</p>",
      });

      expect(result).toBe(true);
    });

    it("handles array of recipients", async () => {
      initEmailService({ host: "smtp.example.com" });

      const result = await sendEmail({
        to: ["a@example.com", "b@example.com"],
        subject: "Multi",
        html: "<p>Hi all</p>",
      });

      expect(result).toBe(true);
    });

    it("returns false when sendMail throws", async () => {
      initEmailService({ host: "smtp.example.com" });

      const transport = (nodemailer.createTransport as ReturnType<typeof vi.fn>).mock.results[0].value;
      transport.sendMail.mockRejectedValueOnce(new Error("SMTP error"));

      const result = await sendEmail({
        to: "fail@example.com",
        subject: "Fail",
        html: "<p>Fail</p>",
      });

      expect(result).toBe(false);
    });
  });

  describe("verifyConnection", () => {
    it("returns false when transporter is not initialized", async () => {
      expect(await verifyConnection()).toBe(false);
    });

    it("returns true when connection is verified", async () => {
      initEmailService({ host: "smtp.example.com" });
      expect(await verifyConnection()).toBe(true);
    });

    it("returns false when verify throws", async () => {
      initEmailService({ host: "smtp.example.com" });

      const transport = (nodemailer.createTransport as ReturnType<typeof vi.fn>).mock.results[0].value;
      transport.verify.mockRejectedValueOnce(new Error("Connection failed"));

      expect(await verifyConnection()).toBe(false);
    });
  });
});
