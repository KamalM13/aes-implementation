import "./PreLoader.css";

export default function PreLoader({ withBG = true }: any) {
  return (
    <div
      className={` ${withBG ? `preloader-container dark:bg-black bg-white` : 'flex justify-center py-24'}`}
    >
      <div className="preloader">
        <div className="loader">
          <div className={`test dark:bg-black bg-white`}></div>
        </div>
      </div>
    </div>
  );
}
