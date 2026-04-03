import MGCRouter from "./router/MGCRouter.jsx";
import { Toaster } from "react-hot-toast";
import TopLoadingBar from "./components/TopLoadingBar.jsx";
import "./App.css";

function App() {
  return (
    <>
      <TopLoadingBar />
      <MGCRouter />
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3050 }}
      />
    </>
  );
}

export default App;
