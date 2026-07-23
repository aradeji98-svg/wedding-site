const scene = document.querySelector('.envelope-scene');
const openButton = document.querySelector('.open-button');
const birdSwarm = document.querySelector('.bird-swarm');
let revealTimer;

scene.classList.remove('is-open');
document.body.classList.remove('show-invitation');

const birdPaths = [
  [-46,-34],[-34,-54],[-18,-62],[5,-58],[24,-49],[44,-31],
  [-55,-12],[-42,7],[-30,31],[-12,48],[10,54],[31,38],[51,17],
  [-52,25],[-37,49],[-16,65],[7,68],[29,57],[48,39],
  [-61,-43],[-26,-73],[20,-70],[58,-46],[-65,4],[64,2]
];

birdPaths.forEach(([x, y], index) => {
  const bird = document.createElement('span');
  bird.style.setProperty('--fly-x', `${x}vw`);
  bird.style.setProperty('--fly-y', `${y}vh`);
  bird.style.setProperty('--bird-scale', 0.55 + (index % 6) * 0.12);
  bird.style.setProperty('--bird-rotation', `${-24 + (index * 17) % 49}deg`);
  bird.style.setProperty('--bird-delay', `${(index % 8) * 0.045}s`);
  birdSwarm.appendChild(bird);
});

const startReveal = () => {
  if (!scene.classList.contains('is-open')) return;
  document.body.classList.add('show-invitation');
  birdSwarm.classList.remove('is-flying');
  void birdSwarm.offsetWidth;
  birdSwarm.classList.add('is-flying');
};

const openEnvelope = () => {
  if (scene.classList.contains('is-open')) return;
  scene.classList.add('is-open');
  window.clearTimeout(revealTimer);
  revealTimer = window.setTimeout(startReveal, 1500);
};

openButton.addEventListener('click', openEnvelope);

scene.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  const x = event.clientX / window.innerWidth;
  const y = event.clientY / window.innerHeight;
  scene.style.setProperty('--light-x', `${x * 100}%`);
  scene.style.setProperty('--light-y', `${y * 100}%`);
  scene.style.setProperty('--shift-x', `${(x - 0.5) * 3}px`);
  scene.style.setProperty('--shift-x-reverse', `${(0.5 - x) * 3}px`);
  scene.style.setProperty('--shift-y', `${(y - 0.5) * 1.5}px`);
});

scene.addEventListener('pointerleave', () => {
  scene.style.setProperty('--light-x', '35%');
  scene.style.setProperty('--light-y', '18%');
  scene.style.setProperty('--shift-x', '0px');
  scene.style.setProperty('--shift-x-reverse', '0px');
  scene.style.setProperty('--shift-y', '0px');
});

document.querySelectorAll('.scratch-circle').forEach((circle) => {
  const canvas = circle.querySelector('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let drawing = false;
  let revealed = false;

  const paintCover = () => {
    const size = circle.clientWidth;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * ratio;
    canvas.height = size * ratio;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const gradient = context.createRadialGradient(size * .32, size * .25, 2, size / 2, size / 2, size * .7);
    gradient.addColorStop(0, '#f3f8f0');
    gradient.addColorStop(.45, '#bcd8c8');
    gradient.addColorStop(1, '#4f8a72');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    context.fillStyle = 'rgba(255,255,255,.5)';
    for (let n = 0; n < 45; n += 1) {
      context.beginPath();
      context.arc((n * 29) % size, (n * 47) % size, .5 + n % 2, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = 'rgba(38,74,61,.78)';
    context.font = `500 ${Math.max(8, size * .11)}px Manrope`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('SCRATCH', size / 2, size / 2);
  };

  const erase = (event) => {
    if (revealed) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(x, y, rect.width * .16, 0, Math.PI * 2);
    context.fill();
  };

  const checkReveal = () => {
    if (revealed) return;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let index = 3; index < pixels.length; index += 32) {
      if (pixels[index] < 40) transparent += 1;
    }
    if (transparent / (pixels.length / 32) > .48) {
      revealed = true;
      canvas.classList.add('is-cleared');
    }
  };

  canvas.addEventListener('pointerdown', (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    erase(event);
  });
  canvas.addEventListener('pointermove', (event) => { if (drawing) erase(event); });
  canvas.addEventListener('pointerup', () => { drawing = false; checkReveal(); });
  canvas.addEventListener('pointercancel', () => { drawing = false; });

  paintCover();
});

const inviteLetter = document.querySelector('.invite-letter');
const letterObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    inviteLetter.classList.add('is-visible');
    letterObserver.disconnect();
  }
}, { threshold: 0.22 });

letterObserver.observe(inviteLetter);

const revealPage = document.querySelector('.reveal-page');
const calendarSection = document.querySelector('.calendar-section');
const calendarDays = calendarSection.querySelector('.calendar__days');
const calendarHeart = calendarSection.querySelector('.calendar-heart');
const calendarHeartPath = calendarHeart.querySelector('path');
const calendarWeddingDay = calendarSection.querySelector('.wedding-day');
let calendarScrollFrame;

const getCalendarHeartPosition = (cell) => ({
  x: cell.offsetLeft,
  y: cell.offsetTop
});

const updateCalendarHeartProgress = () => {
  calendarScrollFrame = undefined;

  const sectionRect = calendarSection.getBoundingClientRect();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startAt = window.innerHeight * .45;
  const finishAt = 0;
  const rawProgress = (startAt - sectionRect.top) / (startAt - finishAt);
  const progress = prefersReducedMotion ? 1 : Math.min(Math.max(rawProgress, 0), 1);
  const position = getCalendarHeartPosition(calendarWeddingDay);
  const scale = .9 + progress * .1;

  calendarHeart.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`;
  calendarHeart.style.opacity = progress > .01 ? '1' : '0';
  calendarHeartPath.style.strokeDashoffset = String(1 - progress);
};

const requestCalendarHeartProgress = () => {
  if (calendarScrollFrame !== undefined) return;
  calendarScrollFrame = window.requestAnimationFrame(updateCalendarHeartProgress);
};

const calendarObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    calendarSection.classList.add('is-visible');
    requestCalendarHeartProgress();
  }
}, { threshold: 0.2 });
calendarObserver.observe(calendarSection);

const gallerySection = document.querySelector('.gallery-section');
const galleryObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    gallerySection.classList.add('is-visible');
    galleryObserver.disconnect();
  }
}, { threshold: 0.2 });
galleryObserver.observe(gallerySection);

revealPage.addEventListener('scroll', requestCalendarHeartProgress, { passive: true });
window.addEventListener('resize', requestCalendarHeartProgress);
requestCalendarHeartProgress();

const dressCodeSection = document.querySelector('.dress-code-section');
const dressCodeObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    dressCodeSection.classList.add('is-visible');
  } else {
    dressCodeSection.classList.remove('is-visible');
  }
}, { threshold: 0.2 });
dressCodeObserver.observe(dressCodeSection);

const triviaSection = document.querySelector('.trivia-section');
const triviaObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    triviaSection.classList.add('is-visible');
    triviaObserver.disconnect();
  }
}, { threshold: 0.15 });
triviaObserver.observe(triviaSection);

const triviaQuestions = [...document.querySelectorAll('.trivia-question')];
const triviaProgressBar = document.querySelector('.trivia-progress span');
const triviaResult = document.querySelector('.trivia-result');
const triviaResultScore = triviaResult.querySelector('b');
let triviaScore = 0;
let triviaAnswered = 0;

const updateTriviaProgress = () => {
  const percent = (triviaAnswered / triviaQuestions.length) * 100;
  triviaProgressBar.style.width = `${percent}%`;
};

const revealNextTrivia = (currentIndex) => {
  const next = triviaQuestions[currentIndex + 1];
  if (next) {
    next.classList.remove('is-hidden');
    requestAnimationFrame(() => next.classList.add('is-active'));
    next.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    triviaResultScore.textContent = String(triviaScore);
    triviaResult.hidden = false;
    requestAnimationFrame(() => triviaResult.classList.add('is-visible'));
    triviaResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

triviaQuestions.forEach((question, index) => {
  const options = question.querySelectorAll('.trivia-options button');
  options.forEach((button) => {
    button.addEventListener('click', () => {
      if (question.classList.contains('is-answered')) return;
      question.classList.add('is-answered');
      triviaAnswered += 1;

      const isCorrect = button.dataset.correct === 'true';
      button.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      if (isCorrect) {
        triviaScore += 1;
      } else {
        const correctButton = [...options].find((opt) => opt.dataset.correct === 'true');
        if (correctButton) correctButton.classList.add('is-correct');
      }

      updateTriviaProgress();
      window.setTimeout(() => revealNextTrivia(index), 500);
    });
  });
});

const locationSection = document.querySelector('.location-section');
const locationObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    locationSection.classList.add('is-visible');
    locationObserver.disconnect();
  }
}, { threshold: 0.2 });
locationObserver.observe(locationSection);

const guestFormSection = document.querySelector('.guest-form-section');
const guestFormObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    guestFormSection.classList.add('is-visible');
    guestFormObserver.disconnect();
  }
}, { threshold: 0.12 });
guestFormObserver.observe(guestFormSection);

const closingSection = document.querySelector('.closing-section');
const closingObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    closingSection.classList.add('is-visible');
    closingObserver.disconnect();
  }
}, { threshold: 0.25 });
closingObserver.observe(closingSection);

const guestForm = document.querySelector('.guest-form');
const companionField = guestForm.querySelector('.guest-companion');
const companionInput = companionField.querySelector('input');
const companyInputs = guestForm.querySelectorAll('input[name="company"]');
const drinkInputs = guestForm.querySelectorAll('input[name="drinks"]');
const noAlcoholInput = guestForm.querySelector('input[name="drinks"][value="none"]');
const formStatus = guestForm.querySelector('.guest-form__status');
const guestSubmitButton = guestForm.querySelector('.guest-form__submit');
const guestSuccess = guestForm.querySelector('.guest-form__success');
const guestSuccessName = guestSuccess.querySelector('h3 b');

companyInputs.forEach((input) => {
  input.addEventListener('change', () => {
    const withGuest = input.value === 'withGuest' && input.checked;
    companionField.hidden = !withGuest;
    companionInput.required = withGuest;
    if (!withGuest) companionInput.value = '';
  });
});

drinkInputs.forEach((input) => {
  input.addEventListener('change', () => {
    if (input === noAlcoholInput && input.checked) {
      drinkInputs.forEach((drink) => { if (drink !== noAlcoholInput) drink.checked = false; });
    } else if (input.checked) {
      noAlcoholInput.checked = false;
    }
  });
});

guestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!guestForm.reportValidity()) return;

  const formData = new FormData(guestForm);
  const response = {
    guestName: formData.get('guestName'),
    attendance: formData.get('attendance'),
    company: formData.get('company'),
    companionName: formData.get('companionName') || '',
    drinks: formData.getAll('drinks'),
    website: formData.get('website') || '',
    submittedAt: new Date().toISOString()
  };

  guestSubmitButton.disabled = true;
  guestSubmitButton.textContent = 'Sending…';
  formStatus.textContent = '';
  guestSuccess.setAttribute('aria-hidden', 'true');
  guestForm.classList.remove('is-submitted', 'has-error');

  try {
    const serverResponse = await fetch('api/guest-response.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });
    const result = await serverResponse.json().catch(() => ({}));

    if (!serverResponse.ok || !result.ok) {
      throw new Error(result.message || 'The server could not save your response.');
    }

    localStorage.setItem('olayemiEmmanuelGuestResponse', JSON.stringify(response));
    guestSuccessName.textContent = response.guestName.trim().split(/\s+/)[0];
    guestSuccess.setAttribute('aria-hidden', 'false');
    guestForm.classList.add('is-submitted');
  } catch (error) {
    formStatus.textContent = error.message || 'Could not submit your response. Please try again.';
    guestForm.classList.add('has-error');
  } finally {
    guestSubmitButton.disabled = false;
    guestSubmitButton.textContent = 'Submit response';
  }
});

document.querySelector('.save-date').addEventListener('click', () => {
  const eventData = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Olayemi and Emmanuel Wedding//EN',
    'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    'UID:olayemi-emmanuel-wedding-20260815@wedding-invitation',
    'DTSTAMP:20260801T120000Z','DTSTART;VALUE=DATE:20260815','DTEND;VALUE=DATE:20260816',
    'SUMMARY:Wedding of Olayemi and Emmanuel',
    'DESCRIPTION:We would be delighted to share this day with you!',
    'STATUS:CONFIRMED','END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([eventData], { type:'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'olayemi-emmanuel-wedding-15-08-2026.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
