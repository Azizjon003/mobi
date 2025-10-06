import { Scenes, Context } from "telegraf";
import { message } from "telegraf/filters";
import { db } from "../database";
import { UserRole } from "../types";

interface UserManagementSceneSession extends Scenes.SceneSession {
  action?: "add" | "remove" | "update";
  selectedUserId?: number;
  selectedRole?: UserRole;
}

interface UserManagementSceneContext extends Context {
  scene: Scenes.SceneContextScene<
    UserManagementSceneContext,
    UserManagementSceneSession
  >;
  session: UserManagementSceneSession;
}

export const userManagementScene =
  new Scenes.BaseScene<UserManagementSceneContext>("user_management");

const SUPER_ADMIN_ID = parseInt(process.env.SUPER_ADMIN_ID!);

const roleNames: Record<UserRole, string> = {
  super_admin: "Super Admin",
  seller: "Sotuvchi",
  collector: "Undiruvchi",
  seller_collector: "Sotuvchi va Undiruvchi",
};

const roleDescriptions: Record<UserRole, string> = {
  super_admin: "Barcha huquqlar",
  seller: "Shartnoma yuklash",
  collector: "Qidiruv va ko'rish",
  seller_collector: "Yuklash va Qidiruv",
};

// Enter scene - show user list
userManagementScene.enter(async (ctx) => {
  const users = db.getAllUsers();

  let message = "👥 Foydalanuvchilar ro'yxati:\n\n";

  if (users.length === 0) {
    message += "Hozircha foydalanuvchilar yo'q.\n\n";
  } else {
    users.forEach((user, index) => {
      message += `${index + 1}. ID: ${user.userId}\n`;
      message += `   Rol: ${roleNames[user.role]}\n`;
      message += `   Qo'shilgan: ${new Date(user.addedAt).toLocaleDateString(
        "uz-UZ"
      )}\n\n`;
    });
  }

  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Foydalanuvchi qo'shish", callback_data: "add_user" }],
        [
          { text: "➖ Foydalanuvchi o'chirish", callback_data: "remove_user" },
          { text: "✏️ Rolni o'zgartirish", callback_data: "update_role" },
        ],
        [{ text: "🔙 Orqaga", callback_data: "back_to_start" }],
      ],
    },
  });
});

// Handle callback queries
userManagementScene.hears("/start", async (ctx) => {
  return ctx.scene.enter("start");
});

userManagementScene.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === "add_user") {
    await ctx.answerCbQuery();
    ctx.session.action = "add";

    await ctx.reply(
      "➕ Foydalanuvchi qo'shish\n\n" +
        "Quyidagilardan birini yuboring:\n" +
        "🔢 Foydalanuvchi ID'si: 123456789\n" +
        "📨 Foydalanuvchidan forward qilingan xabar\n\n" +
        "❌ Bekor qilish: /cancel"
    );
  } else if (data === "remove_user") {
    await ctx.answerCbQuery();
    const users = db.getAllUsers();

    if (users.length === 0) {
      return ctx.reply("❌ O'chiriladigan foydalanuvchilar yo'q.");
    }

    ctx.session.action = "remove";

    let message = "➖ O'chirish uchun foydalanuvchi ID'sini yuboring:\n\n";
    users.forEach((user, index) => {
      message += `${index + 1}. ID: ${user.userId} - ${roleNames[user.role]}\n`;
    });
    message += "\n❌ Bekor qilish: /cancel";

    await ctx.reply(message);
  } else if (data === "update_role") {
    await ctx.answerCbQuery();
    const users = db.getAllUsers();

    if (users.length === 0) {
      return ctx.reply("❌ Rolni o'zgartirish uchun foydalanuvchilar yo'q.");
    }

    ctx.session.action = "update";

    let message =
      "✏️ Rolni o'zgartirish uchun foydalanuvchi ID'sini yuboring:\n\n";
    users.forEach((user, index) => {
      message += `${index + 1}. ID: ${user.userId} - ${roleNames[user.role]}\n`;
    });
    message += "\n❌ Bekor qilish: /cancel";

    await ctx.reply(message);
  } else if (data === "back_to_start") {
    await ctx.answerCbQuery();
    return ctx.scene.enter("start");
  } else if (data?.startsWith("select_role:")) {
    await ctx.answerCbQuery();
    const role = data.split(":")[1] as UserRole;

    if (ctx.session.action === "add" && ctx.session.selectedUserId) {
      const added = db.addUser(ctx.session.selectedUserId, role, ctx.from!.id);

      if (added) {
        await ctx.reply(
          `✅ Foydalanuvchi muvaffaqiyatli qo'shildi!\n\n` +
            `🆔 ID: ${ctx.session.selectedUserId}\n` +
            `👤 Rol: ${roleNames[role]}\n` +
            `📋 Huquqlar: ${roleDescriptions[role]}`
        );
      } else {
        await ctx.reply(
          `❌ Bu foydalanuvchi allaqachon mavjud.\n\n🆔 ID: ${ctx.session.selectedUserId}`
        );
      }

      return ctx.scene.enter("start");
    } else if (ctx.session.action === "update" && ctx.session.selectedUserId) {
      const updated = db.updateUserRole(ctx.session.selectedUserId, role);

      if (updated) {
        await ctx.reply(
          `✅ Rol muvaffaqiyatli o'zgartirildi!\n\n` +
            `🆔 ID: ${ctx.session.selectedUserId}\n` +
            `👤 Yangi rol: ${roleNames[role]}\n` +
            `📋 Huquqlar: ${roleDescriptions[role]}`
        );
      } else {
        await ctx.reply(`❌ Xatolik yuz berdi.`);
      }

      return ctx.scene.enter("start");
    }
  }
});

// Handle text messages
userManagementScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text.trim();

  // Check if this is a forwarded message
  if ("forward_from" in ctx.message && ctx.message.forward_from) {
    const forwardedFrom = ctx.message.forward_from;
    const userId = forwardedFrom.id;

    if (ctx.session.action !== "add") {
      return ctx.reply("⚠️ Avval foydalanuvchi qo'shish tugmasini bosing.");
    }

    // Check if it's super admin
    if (userId === SUPER_ADMIN_ID) {
      await ctx.reply("❌ Super adminni qo'shish kerak emas.");
      return ctx.scene.enter("start");
    }

    // Check if user already exists
    if (db.getUser(userId)) {
      await ctx.reply("❌ Bu foydalanuvchi allaqachon mavjud.");
      return ctx.scene.enter("start");
    }

    ctx.session.selectedUserId = userId;

    const username = forwardedFrom.username
      ? `@${forwardedFrom.username}`
      : "username yo'q";
    const firstName = forwardedFrom.first_name || "";
    const lastName = forwardedFrom.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    await ctx.reply(
      `Foydalanuvchi ma'lumotlari:\n` +
        `👤 Ism: ${fullName}\n` +
        `🆔 ID: ${userId}\n` +
        `📝 Username: ${username}\n\n` +
        "Rolni tanlang:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 Sotuvchi", callback_data: "select_role:seller" }],
            [{ text: "🔍 Undiruvchi", callback_data: "select_role:collector" }],
            [{ text: "📋 Sotuvchi va Undiruvchi", callback_data: "select_role:seller_collector" }],
            [
              {
                text: "👑 Super Admin",
                callback_data: "select_role:super_admin",
              },
            ],
            [{ text: "❌ Bekor qilish", callback_data: "back_to_start" }],
          ],
        },
      }
    );

    return;
  }

  // Check for cancel command
  if (text === "/cancel") {
    await ctx.reply("❌ Bekor qilindi.");
    return ctx.scene.enter("start");
  }

  // Try to parse as user ID
  const userId = parseInt(text);

  if (isNaN(userId)) {
    return ctx.reply(
      "❌ Noto'g'ri format! Faqat raqamlar kiriting.\n\nMisol: 123456789"
    );
  }

  if (ctx.session.action === "add") {
    // Check if it's super admin
    if (userId === SUPER_ADMIN_ID) {
      await ctx.reply("❌ Super adminni qo'shish kerak emas.");
      return ctx.scene.enter("start");
    }

    // Check if user already exists
    if (db.getUser(userId)) {
      await ctx.reply("❌ Bu foydalanuvchi allaqachon mavjud.");
      return ctx.scene.enter("start");
    }

    ctx.session.selectedUserId = userId;

    await ctx.reply(
      "Foydalanuvchi rolini tanlang:\n\n" +
        "👤 Sotuvchi - Shartnoma yuklash huquqi\n" +
        "🔍 Undiruvchi - Qidiruv va ko'rish huquqi\n" +
        "📋 Sotuvchi va Undiruvchi - Yuklash va qidiruv\n" +
        "👑 Super Admin - Barcha huquqlar",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 Sotuvchi", callback_data: "select_role:seller" }],
            [{ text: "🔍 Undiruvchi", callback_data: "select_role:collector" }],
            [{ text: "📋 Sotuvchi va Undiruvchi", callback_data: "select_role:seller_collector" }],
            [
              {
                text: "👑 Super Admin",
                callback_data: "select_role:super_admin",
              },
            ],
            [{ text: "❌ Bekor qilish", callback_data: "back_to_start" }],
          ],
        },
      }
    );
  } else if (ctx.session.action === "remove") {
    // Check if it's super admin
    if (userId === SUPER_ADMIN_ID) {
      await ctx.reply("❌ Super adminni o'chirish mumkin emas.");
      return ctx.scene.enter("start");
    }

    const removed = db.removeUser(userId);

    if (removed) {
      await ctx.reply(
        `✅ Foydalanuvchi muvaffaqiyatli o'chirildi!\n\n🆔 ID: ${userId}`
      );
    } else {
      await ctx.reply(`❌ Bu foydalanuvchi mavjud emas.\n\n🆔 ID: ${userId}`);
    }

    return ctx.scene.enter("start");
  } else if (ctx.session.action === "update") {
    // Check if it's super admin
    if (userId === SUPER_ADMIN_ID) {
      await ctx.reply("❌ Super admin rolini o'zgartirib bo'lmaydi.");
      return ctx.scene.enter("start");
    }

    const user = db.getUser(userId);

    if (!user) {
      await ctx.reply(`❌ Bu foydalanuvchi mavjud emas.\n\n🆔 ID: ${userId}`);
      return ctx.scene.enter("start");
    }

    ctx.session.selectedUserId = userId;

    await ctx.reply(
      `Foydalanuvchi: ${userId}\n` +
        `Hozirgi rol: ${roleNames[user.role]}\n\n` +
        "Yangi rolni tanlang:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 Sotuvchi", callback_data: "select_role:seller" }],
            [{ text: "🔍 Undiruvchi", callback_data: "select_role:collector" }],
            [{ text: "📋 Sotuvchi va Undiruvchi", callback_data: "select_role:seller_collector" }],
            [
              {
                text: "👑 Super Admin",
                callback_data: "select_role:super_admin",
              },
            ],
            [{ text: "❌ Bekor qilish", callback_data: "back_to_start" }],
          ],
        },
      }
    );
  }
});

// Handle /cancel command
userManagementScene.command("cancel", async (ctx) => {
  await ctx.reply("❌ Bekor qilindi.");
  return ctx.scene.enter("start");
});

// Handle other input
userManagementScene.on("message", async (ctx) => {
  await ctx.reply(
    "⚠️ Iltimos, quyidagilardan birini yuboring:\n\n" +
      "1️⃣ Foydalanuvchi ID'si (123456789)\n" +
      "2️⃣ Foydalanuvchidan forward qilingan xabar\n" +
      "3️⃣ /cancel - Bekor qilish"
  );
});
