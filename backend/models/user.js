import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    ID: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    publicUserID: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "custom_public_user_id_unique",
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    emailAddress: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: "custom_email_address_unique",
      validate: { isEmail: true },
    },
    contactNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    unitNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isIn: [[
          101, 102, 103, 104, 105, 106, 107,
          201, 202, 203, 204, 205, 206,
          301, 302, 303, 304, 305, 306, 307, 308,
          309, 310, 311, 312, 313, 314, 315, 316,
          401, 402, 403, 404, 405, 406, 407, 408,
        ]],
      },
    },
    numberOfTenants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 2 },
    },
    userName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "custom_user_name_unique",
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "caretaker", "tenant"),
      allowNull: false,
      defaultValue: "tenant",
    },
    loginToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verification_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    resetPasswordCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    code_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Declined"),
      allowNull: false,
      defaultValue: "Pending",
    },
    sex: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: true,
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "profile_picture",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
        if (!user.publicUserID) {
          user.publicUserID = `PUBLIC-USER-${Date.now()}`;
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password_hash")) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password_hash);
};

export default User;
