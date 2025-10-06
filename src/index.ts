import { Telegraf, Context, Scenes, session } from "telegraf";
import * as dotenv from "dotenv";
import { db } from "./database";
import { startScene } from "./scenes/start.scene";
import { uploadScene } from "./scenes/upload.scene";
import { addAdminScene } from "./scenes/addadmin.scene";
import { userManagementScene } from "./scenes/usermanagement.scene";
import { UserRole } from "./types";

dotenv.config();

// Define scene context
interface MySceneSession extends Scenes.SceneSession {
  fileId?: string;
  fileName?: string;
  fullName?: string;
}

interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, MySceneSession>;
  session: MySceneSession;
}

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN!);
const SUPER_ADMIN_ID = parseInt(process.env.SUPER_ADMIN_ID!);

// Create stage and register scenes
const stage = new Scenes.Stage<MyContext>([
  startScene,
  uploadScene,
  addAdminScene,
  userManagementScene,
]);

// Middleware
bot.use(session());
bot.use(stage.middleware());

// Helper functions for role-based access control
const getUserRole = (ctx: MyContext): UserRole | undefined => {
  if (!ctx.from) return undefined;
  if (ctx.from.id === SUPER_ADMIN_ID) return "super_admin";
  return db.getUserRole(ctx.from.id);
};

const isAuthorized = (ctx: MyContext): boolean => {
  if (!ctx.from) return false;
  return ctx.from.id === SUPER_ADMIN_ID || db.isAuthorized(ctx.from.id);
};

const isSuperAdmin = (ctx: MyContext): boolean => {
  return ctx.from ? ctx.from.id === SUPER_ADMIN_ID : false;
};

const canUpload = (ctx: MyContext): boolean => {
  const role = getUserRole(ctx);
  return role === "super_admin" || role === "seller";
};

const canSearch = (ctx: MyContext): boolean => {
  const role = getUserRole(ctx);
  return role === "super_admin" || role === "collector";
};

// Start command
bot.command("start", async (ctx) => {
  console.log(!isAuthorized(ctx));
  if (!isAuthorized(ctx)) {
    console.log("❌ Kechirasiz, sizda bu botdan foydalanish huquqi yo'q.");
    return ctx.reply("❌ Kechirasiz, sizda bu botdan foydalanish huquqi yo'q.");
  }

  return ctx.scene.enter("start");
});

// Upload command
bot.command("upload", async (ctx) => {
  if (!canUpload(ctx)) {
    return ctx.reply(
      "❌ Sizda PDF yuklash huquqi yo'q. Faqat Sotuvchilar va Super Admin yuklash mumkin."
    );
  }

  return ctx.scene.enter("upload");
});

// Cancel command
bot.command("cancel", async (ctx) => {
  if (!isAuthorized(ctx)) {
    return ctx.reply("❌ Sizda ruxsat yo'q.");
  }

  await ctx.reply("❌ Amal bekor qilindi.");
  return ctx.scene.enter("start");
});

// Search command
bot.command("search", async (ctx) => {
  if (!canSearch(ctx)) {
    return ctx.reply(
      "❌ Sizda qidiruv huquqi yo'q. Faqat Undiruvchilar va Super Admin qidira oladi."
    );
  }

  await ctx.reply("🔍 Qidiruv uchun pastdagi tugmani bosing:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔍 Qidiruv boshlash", switch_inline_query_current_chat: "" }],
      ],
    },
  });
});

// Users command (super admin only)
bot.command("users", async (ctx) => {
  if (!isSuperAdmin(ctx)) {
    return ctx.reply("❌ Bu buyruq faqat Super Admin uchun.");
  }

  return ctx.scene.enter("user_management");
});

// Inline query handler for search
bot.on("inline_query", async (ctx) => {
  if (!canSearch(ctx)) {
    return ctx.answerInlineQuery([]);
  }

  const query = ctx.inlineQuery.query.trim();

  if (!query || query.length < 2) {
    return ctx.answerInlineQuery([], {
      button: {
        text: "🔍 Qidirish uchun kamida 2 ta belgi kiriting",
        start_parameter: "start",
      },
      cache_time: 0,
    });
  }

  const results = db.searchDocuments(query);

  if (results.length === 0) {
    return ctx.answerInlineQuery([], {
      button: {
        text: "❌ Hech narsa topilmadi",
        start_parameter: "start",
      },
      cache_time: 0,
    });
  }

  const inlineResults = results.slice(0, 50).map((doc) => ({
    type: "document" as const,
    id: doc.id,
    title: doc.fullName,
    description: `📋 Shartnoma: ${doc.applicationNumber} | 📄 ${doc.fileName}`,
    document_file_id: doc.fileId,
    caption: `👤 Ism: ${doc.fullName}\n📋 Shartnoma raqami: ${
      doc.applicationNumber
    }\n📅 Yuklangan: ${new Date(doc.uploadedAt).toLocaleDateString("uz-UZ")}`,
  }));

  await ctx.answerInlineQuery(inlineResults, {
    cache_time: 30,
    is_personal: true,
  });
});

// Error handling
bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
});

// Start bot
bot.launch().then(() => {
  console.log("✅ Bot ishga tushdi!");
  console.log(`👤 Super Admin ID: ${SUPER_ADMIN_ID}`);
  console.log(`👥 Adminlar soni: ${db.getAllAdmins().length}`);
  console.log(`📢 Channel ID: ${process.env.CHANNEL_ID}`);
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
