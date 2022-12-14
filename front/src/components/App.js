import React from 'react';
import { Switch, Route, Redirect, useHistory } from "react-router-dom";
import Header from './Header';
import Main from './Main';
import Footer from './Footer';
import ImagePopup from './ImagePopup';
import CurrentUserContext from "../contexts/CurrentUserContext";
import api from "../utils/Api";
import EditProfilePopup from './EditProfilePopup';
import AddPlacePopup from './AddPlacePopup';
import EditAvatarPopup from './EditAvatarPopup';
import Register from "./Register";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import InfoTooltip from "./InfoTooltip";
import * as auth from "../utils/auth";

function App() {
  const [isInfoTooltipOpened, setIsInfoTooltipOpened] = React.useState(false)
  const [isPopupAvatarOpened, setIsPopupAvatarOpened] = React.useState(false)
  const [isPopupProfileOpened, setIsPopupProfileOpened] = React.useState(false)
  const [isPopupAddPlaceOpened, setIsPopupAddPlaceOpened] = React.useState(false)
  const [isPopupImageOpened, setIsPopupImageOpened] = React.useState(false)
  const [selectedCard, setSelectedCard] = React.useState({})
  const [currentUser, setCurrentUser] = React.useState({});
  const [cards, setCards] = React.useState([])
  const [loadingStatus, setLoadingStatus] = React.useState(false)
  const [loggedIn, setLoggedIn] = React.useState(false)
  const [registrationResult, setRegistrationResult] = React.useState(false)
  const [email, setEmail] = React.useState("");
  const history = useHistory();

  React.useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      Promise.all([auth.getData(jwt), api.getInitialCards()])
        .then(([userInfo, cardList]) => {
          setLoggedIn(true);
          setEmail(userInfo.email);
          setCurrentUser(userInfo);
          setCards(cardList.data);
          history.push("/");
        })
        .catch((err) => {
          console.log(err)
        })
    } else {
      handleSignOut()
    }            
  }, [])
  
  const handleCardClick = (card) => {
    setSelectedCard(card)
    setIsPopupImageOpened(true)
  }

  const handleEditAvatar = () => {
    setIsPopupAvatarOpened(true)
  }

  const handleEditProfile = () => {
    setIsPopupProfileOpened(true)
  }

  const handleAddPlace = () => {
    setIsPopupAddPlaceOpened(true)
  }

  const handleUpdateUserInfo = (data) => {
    setLoadingStatus(true)
    api.editUserInfo(data)
      .then((user) => {
        setCurrentUser(user.data);
        closeAllPopups();
        setLoadingStatus(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const submitEditAvatar = (data) => {
    setLoadingStatus(true)
    api.editAvatar(data)
      .then((url) => {
        setCurrentUser(url.data);
        closeAllPopups();
        setLoadingStatus(false)
      })
      .catch((err) => {
        console.log(err)
      })
  };

  const closeAllPopups = () => {
    setIsPopupAvatarOpened(false)
    setIsPopupProfileOpened(false)
    setIsPopupAddPlaceOpened(false)
    setIsPopupImageOpened(false)
    setSelectedCard({})
    setIsInfoTooltipOpened(false);
  }

  const handleCardLike = (card) => {
    const isLiked = card.likes.some(i => i === currentUser._id);
    api.changeLikeCardStatus(card._id, !isLiked)
      .then((newCard) => {
        setCards((state) => state.map((c) => c._id === card._id ? newCard : c));
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const handleCardDelete = (card) => {
    api.deleteCard(card._id)
      .then(() => {
        setCards((cards) => {
          return cards.filter((item) => item !== card)});
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const handleAddPlaceSubmit = (data) => {
    setLoadingStatus(true)
    api.addCard(data)
      .then((newCard) => {
        setCards([newCard.data, ...cards]);
        closeAllPopups();
        setLoadingStatus(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  const handleRegistration = (email, password) => {
    auth
      .register(email, password)
      .then((res) => {
        if (res.data._id) {
          setRegistrationResult(true);
          history.push("/sign-in");
        }
        else {
          setRegistrationResult(false);
        }
      })
      .catch((err) => {
        setRegistrationResult(false);
        console.log(err);
      })
      .finally(() => {
        setIsInfoTooltipOpened(true);
      });
  };

  const handleAuthorization = (email, password) => {
    auth
      .authorize(email, password)
      .then((data) => auth.getData(data.token))
      .then((res) => {
        if (res) {
          setEmail(email);
          setLoggedIn(true);
          history.push("/");
        }
        else {
          setRegistrationResult(false);
          setIsInfoTooltipOpened(true);
        }
      })
      .catch((err) => {
        setRegistrationResult(false);
        setIsInfoTooltipOpened(true);
        console.log(err)
      })
  };

  const handleSignOut = () => {
    setLoggedIn(false);
    localStorage.removeItem("jwt");
    history.push("/sign-in");
  };

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="page">
        <div className="page__container">
        <Header email={email} onSignOut={handleSignOut} />
        <Switch>
          <ProtectedRoute
            exact path="/"
            loggedIn={loggedIn}
            cards={cards}
            onCardClick={handleCardClick}
            onCardLike={handleCardLike}
            onCardDelete={handleCardDelete}
            onEditAvatar={handleEditAvatar}
            onEditProfile={handleEditProfile}
            onAddPlace={handleAddPlace}
            component={Main}
          />
          <Route path="/sign-in">
            <Login onLogin={handleAuthorization} />
          </Route>
          <Route path="/sign-up">
            <Register onRegister={handleRegistration} />
          </Route>
          <Route>
            {loggedIn ? <Redirect to="/" /> : <Redirect to="/sign-in" />}
          </Route>
        </Switch>
        
        { loggedIn && <Footer /> }

        <EditAvatarPopup 
          isOpen={isPopupAvatarOpened}
          onClose={closeAllPopups}
          onEditAvatar={submitEditAvatar}
          loadingStatus={loadingStatus}
        />      

        <EditProfilePopup
          isOpen={isPopupProfileOpened}
          onClose={closeAllPopups}
          onUpdateProfileInfo={handleUpdateUserInfo}
          loadingStatus={loadingStatus}
        />      
  
        <AddPlacePopup 
          isOpen={isPopupAddPlaceOpened}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlaceSubmit}
          loadingStatus={loadingStatus}
        />

        <ImagePopup 
          isOpen={isPopupImageOpened}
          onClose={closeAllPopups}
          card={selectedCard}
        />

        <InfoTooltip
          name='tooltip'
          isOpen={isInfoTooltipOpened}
          onClose={closeAllPopups}
          registrationResult={registrationResult}
        />
      </div>
    </div>
  </CurrentUserContext.Provider>
  );
}

export default App;
