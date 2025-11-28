.img-carousel__wrap {
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  display: flex;
}

.img-carousel__list {
  z-index: 1;
  perspective: 90vw;
  perspective-origin: 50%;
  transform-style: preserve-3d;
  justify-content: center;
  align-items: center;
  width: 80vw;
  height: 50vw;
  margin-left: auto;
  margin-right: auto;
  font-size: 1vw;
  display: flex;
  position: relative;
}

@media only screen and (max-width: 1024px) {
  .img-carousel__list {
    zoom: 200%;
  }
}

.img-carousel__panel {
  z-index: 0;
  flex-direction: column;
  flex: none;
  justify-content: space-between;
  align-items: stretch;
  width: 20em;
  height: 30em;
  display: flex;
  position: absolute;
  overflow: visible;
}

.img-carousel__panel:nth-of-type(even) {
  justify-content: center;
}

.img-carousel__item {
  aspect-ratio: 1;
  width: 100%;
  position: relative;
  overflow: visible;
}

.img-carousel__img {
  object-fit: cover;
  width: 100%;
  max-width: none;
  height: 100%;
  position: absolute;
  inset: 0%;
  transform: scale(1.1);
  transform-origin: center;
}
