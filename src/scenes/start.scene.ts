import { Scenes, Context } from "telegraf";
import { db } from "../database";
import { UserRole } from "../types";
import * as dotenv from "dotenv";

dotenv.config();
interface StartSceneSession extends Scenes.SceneSession {
  // Empty for now
}

interface StartSceneContext extends Context {
  scene: Scenes.SceneContextScene<StartSceneContext, StartSceneSession>;
  session: StartSceneSession;
}

export const startScene = new Scenes.BaseScene<StartSceneContext>("start");

const SUPER_ADMIN_ID = parseInt(process.env.SUPER_ADMIN_ID!);

// Helper function to check if user is super admin
const isSuperAdmin = (ctx: StartSceneContext): boolean => {
  return ctx.from ? ctx.from.id === SUPER_ADMIN_ID : false;
};

// Helper function to get user role
const getUserRole = (ctx: StartSceneContext): UserRole | undefined => {
  if (!ctx.from) return undefined;
  console.log(ctx.from.id, SUPER_ADMIN_ID, ctx.from.id === SUPER_ADMIN_ID);
  if (ctx.from.id === SUPER_ADMIN_ID) return "super_admin";
  return db.getUserRole(ctx.from.id);
};


// Enter scene - show main menu
startScene.enter(async (ctx) => {
  const role = getUserRole(ctx);
  console.log(role);
  if (!role) {
    return ctx.reply("❌ Kechirasiz, sizda bu botdan foydalanish huquqi yo'q.");
  }

  const keyboard: any[] = [];

  // Role-based buttons
  if (role === "super_admin") {
    keyboard.push([
      { text: "📤 PDF Yuklash", callback_data: "upload" },
      { text: "🔍 Qidiruv", switch_inline_query_current_chat: "" },
    ]);
    keyboard.push([
      { text: "👥 Foydalanuvchilar", callback_data: "manage_users" },
    ]);
  } else if (role === "seller") {
    keyboard.push([{ text: "📤 PDF Yuklash", callback_data: "upload" }]);
  } else if (role === "collector") {
    keyboard.push([
      { text: "🔍 Qidiruv", switch_inline_query_current_chat: "" },
    ]);
  } else if (role === "seller_collector") {
    keyboard.push([
      { text: "📤 PDF Yuklash", callback_data: "upload" },
      { text: "🔍 Qidiruv", switch_inline_query_current_chat: "" },
    ]);
  }

  let welcomeMessage = "👋 Xush kelibsiz!\n\n";

  if (role === "super_admin") {
    welcomeMessage += "👑 Siz Super Adminsiz\n\n";
    welcomeMessage += "📋 Mavjud buyruqlar:\n";
    welcomeMessage += "/upload - PDF yuklash\n";
    welcomeMessage += "/users - Foydalanuvchilar boshqaruvi\n";
    welcomeMessage += "/cancel - Amalni bekor qilish\n\n";
    welcomeMessage += '🔍 Qidiruv uchun "🔍 Qidiruv" tugmasini bosing';
  } else if (role === "seller") {
    welcomeMessage += "👤 Sizning rolingiz: Sotuvchi\n\n";
    welcomeMessage += "📋 Mavjud buyruqlar:\n";
    welcomeMessage += "/upload - PDF yuklash\n";
    welcomeMessage += "/cancel - Amalni bekor qilish";
  } else if (role === "collector") {
    welcomeMessage += "🔍 Sizning rolingiz: Undiruvchi\n\n";
    welcomeMessage += "📋 Mavjud buyruqlar:\n";
    welcomeMessage += "/cancel - Amalni bekor qilish\n\n";
    welcomeMessage += '🔍 Qidiruv uchun "🔍 Qidiruv" tugmasini bosing';
  } else if (role === "seller_collector") {
    welcomeMessage += "📋 Sizning rolingiz: Sotuvchi va Undiruvchi\n\n";
    welcomeMessage += "📋 Mavjud buyruqlar:\n";
    welcomeMessage += "/upload - PDF yuklash\n";
    welcomeMessage += "/cancel - Amalni bekor qilish\n\n";
    welcomeMessage += '🔍 Qidiruv uchun "🔍 Qidiruv" tugmasini bosing';
  }

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
});

// Handle callback queries
startScene.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const role = getUserRole(ctx);

  if (!role) {
    return ctx.answerCbQuery("❌ Sizda ruxsat yo'q.");
  }

  if (data === "upload") {
    if (role !== "super_admin" && role !== "seller") {
      return ctx.answerCbQuery("❌ Sizda PDF yuklash huquqi yo'q.");
    }

    await ctx.answerCbQuery();
    return ctx.scene.enter("upload");
  } else if (data === "manage_users") {
    if (role !== "super_admin") {
      return ctx.answerCbQuery("❌ Bu faqat Super Admin uchun.");
    }

    await ctx.answerCbQuery();
    return ctx.scene.enter("user_management");
  } else if (data === "back_to_menu") {
    await ctx.answerCbQuery();
    return ctx.scene.reenter();
  }
});

// Handle text messages (commands)
startScene.on("message", async (ctx) => {
  if ("text" in ctx.message) {
    const text = ctx.message.text;

    // Commands are handled globally, so we don't need to handle them here
    // Just ignore non-command messages
    if (!text.startsWith("/")) {
      await ctx.reply(
        "⚠️ Iltimos, tugmalardan foydalaning yoki buyruq kiriting."
      );
    }
  }
});
