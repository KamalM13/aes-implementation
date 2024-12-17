import { Link } from "react-router-dom";

const NotFound = () => {

  return (
    <div className="flex flex-col items-center justify-center h-screen">
    <img
      src={"/assets/Tools/404.webp"}
      alt="404"
      width={300}
      height={300}
      className="w-auto h-auto"
    />

    <div className="text-center">
      <p >We could not find the page you were looking for.</p>
      <p >
        Go back to the{" "}
        <Link to="/" className="text-blue-500">
          Home Page
        </Link>
      </p>
    </div>
  </div>
  );
};

export default NotFound;
