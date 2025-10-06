import { Scenes, Context } from "telegraf";
import { message } from "telegraf/filters";
import { db } from "../database";
import { Document, UserRole } from "../types";
import * as crypto from "crypto";

interface UploadSceneSession extends Scenes.SceneSession {
  fileId?: string;
  fileName?: string;
  fullName?: string;
}

interface UploadSceneContext extends Context {
  scene: Scenes.SceneContextScene<UploadSceneContext, UploadSceneSession>;
  session: UploadSceneSession;
}

export const uploadScene = new Scenes.BaseScene<UploadSceneContext>("upload");

const SUPER_ADMIN_ID = parseInt(process.env.SUPER_ADMIN_ID!);

// Helper function to check if user can upload
const canUpload = (ctx: UploadSceneContext): boolean => {
  if (!ctx.from) return false;
  if (ctx.from.id === SUPER_ADMIN_ID) return true;

  const role = db.getUserRole(ctx.from.id);
  return role === "seller" || role === "super_admin";
};

// Enter scene
uploadScene.enter(async (ctx) => {
  // Check permissions
  if (!canUpload(ctx)) {
    await ctx.reply(
      "❌ Sizda PDF yuklash huquqi yo'q. Faqat Sotuvchilar va Super Admin yuklash mumkin."
    );
    return ctx.scene.enter("start");
  }

  await ctx.reply("📄 Iltimos, PDF faylni yuboring:");
});

uploadScene.hears("/start", async (ctx) => {
  return ctx.scene.enter("start");
});

// Handle PDF document
uploadScene.on(message("document"), async (ctx) => {
  const document = ctx.message.document;

  // Check if it's a PDF
  if (!document.mime_type?.includes("pdf")) {
    return ctx.reply(
      "❌ Faqat PDF fayllarni yuklash mumkin!\n\nIltimos, PDF fayl yuboring:"
    );
  }

  // Save file info to session
  ctx.session.fileId = document.file_id;
  ctx.session.fileName = document.file_name || "document.pdf";

  await ctx.reply(
    "✅ PDF qabul qilindi!\n\n👤 Endi to'liq ism-familiyani kiriting:"
  );
});

// Handle text messages
uploadScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text;

  // Check for commands
  if (text.startsWith("/")) {
    if (text === "/cancel") {
      await ctx.reply("❌ Yuklash bekor qilindi.");
      return ctx.scene.leave();
    }
    return;
  }

  // If no file uploaded yet, prompt user
  if (!ctx.session.fileId) {
    return ctx.reply("⚠️ Avval PDF faylni yuklang!");
  }

  // If no full name yet, save it
  if (!ctx.session.fullName) {
    ctx.session.fullName = text;
    return ctx.reply(
      "✅ Ism-familiya saqlandi!\n\n📋 Endi shartnoma raqamini kiriting:"
    );
  }

  // If we have everything, save the document
  try {
    const CHANNEL_ID = process.env.CHANNEL_ID!;

    // Forward PDF to channel
    const channelMessage = await ctx.telegram.sendDocument(
      CHANNEL_ID,
      ctx.session.fileId!,
      {
        caption: `👤 ${ctx.session.fullName}\n📋 ${text}\n📄 ${
          ctx.session.fileName
        }\n📅 ${new Date().toLocaleDateString("uz-UZ")}`,
      }
    );

    const newDoc: Document = {
      id: crypto.randomUUID(),
      fileName: ctx.session.fileName!,
      fullName: ctx.session.fullName!,
      applicationNumber: text,
      fileId: ctx.session.fileId!,
      channelMessageId: channelMessage.message_id,
      uploadedAt: new Date(),
      uploadedBy: ctx.from!.id,
    };

    db.addDocument(newDoc);

    await ctx.reply(
      "✅ Hujjat muvaffaqiyatli saqlandi va kanalga yuklandi!\n\n" +
        `👤 Ism: ${newDoc.fullName}\n` +
        `📋 Shartnoma: ${newDoc.applicationNumber}\n` +
        `📄 Fayl: ${newDoc.fileName}`
    );

    // Return to start scene
    return ctx.scene.enter("start");
  } catch (error) {
    console.error("Error uploading to channel:", error);
    await ctx.reply(
      "❌ Kanalga yuklashda xatolik yuz berdi. Iltimos, botning kanal adminligini tekshiring."
    );
    return ctx.scene.enter("start");
  }
});

// Handle /cancel command
uploadScene.command("cancel", async (ctx) => {
  await ctx.reply("❌ Yuklash bekor qilindi.");
  return ctx.scene.enter("start");
});

// Handle other input
uploadScene.on("message", async (ctx) => {
  await ctx.reply("⚠️ Iltimos, PDF fayl yoki matn yuboring.");
});
