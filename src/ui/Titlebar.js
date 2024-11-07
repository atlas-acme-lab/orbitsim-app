import LogoImg from '../images/logo-full.svg';

export function Titlebar() {
    return (
        <div className="Titlebar">
            <img 
                className="AppLogo"
                src={LogoImg}
                alt="App Logo"
            />
        </div>
    );
}