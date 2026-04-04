import MGCRouter from "./router/MGCRouter.jsx";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  return (
    <>
      <MGCRouter />
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3050 }}
      />
    </>
  );
}

export default App;
