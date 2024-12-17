export default function PoweredByNovaTech() {
  return (
    <footer className="relative flex items-center justify-center py-6 bg-gray-900">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500 to-purple-600 blur-3xl opacity-20"></div>
      
      <div className="text-center">
        <p className="text-base text-gray-300">
          Powered by{" "}
          <a
            href="https://novatecheg.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:from-purple-500 hover:to-blue-400 transition-all duration-300"
          >
            NovaTech
          </a>
        </p>
      </div>
    </footer>
  );
};

