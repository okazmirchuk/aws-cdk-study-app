import React, {useEffect, useState} from 'react';
import './App.css';
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css'
import {Carousel} from "react-bootstrap";

function App() {
  const baseUri = process.env.REACT_APP_API_URL!;
  const [photos, setPhotos] = useState<any[]>([])

  console.log(baseUri)
  useEffect(() => {
    axios.get(`${baseUri}/getAllPhotos`).then(({data}) => {
      console.log(data);
      setPhotos(data)
    })
  }, [])
  return (
    <div className="App bg-secondary min-vh-100">
      <Carousel>
        {photos.map((photo, index) => {
          return (
              <Carousel.Item key={index} style={{height: 350}}>
                <img src={photo.url} alt={photo.filename} className="h-100"/>
                <Carousel.Caption>
                  <h3 style={{backgroundColor: 'rgba(0, 0, 0, .3)'}}>{photo.filename}</h3>
                </Carousel.Caption>
              </Carousel.Item>
          )
        })}
      </Carousel>
    </div>
  );
}

export default App;
