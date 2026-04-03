import { Sequelize } from "sequelize";
import 'dotenv/config';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    }
);

//Connection to database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    process.exit(1); // Exit process to prevent server from running without DB
  }
};

export {sequelize, connectDB};
