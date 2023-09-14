import { useEffect } from 'react';

const useScript = (contents?: string) => {
    console.log(contents);
    useEffect(() => {
        if (contents) {
            const script = document.createElement('script');
            script.text = contents ?? "";
            document.body.appendChild(script);
            return () => {
                document.body.removeChild(script);
            };
        }
        return () => { };
    }, [contents]);
};

export default useScript;