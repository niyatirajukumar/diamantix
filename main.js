import './globals.css';
import './my_events.css';
import DOMPurify from "dompurify";

document.addEventListener('DOMContentLoaded', async () => {
  let res = await fetch("http://localhost:3000/api/events");
  let events = await res.json();
  if (events.length == 0) {
    document.querySelector('.my-events').innerHTML = `<div class="no-events"><span>No upcoming events</span></div>`;
    return;
  }
  let eventElements = events.map(eventTemplate).join('\n');
  document.querySelector('.my-events').innerHTML = eventElements;
});


function eventTemplate(event) {
  let formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  let imageUrl = event.thumbnail ? `https://ipfs.io/ipfs/${event.thumbnail}` : '/logo.png';
  return `<a href="/event/?id=${DOMPurify.sanitize(event.slug)}">
          <div class="event-card">
            <time datetime="${DOMPurify.sanitize(event.date)}" class="_time">${DOMPurify.sanitize(formattedDate)} &nbsp;&nbsp;${new Date(event.date).toLocaleDateString() == new Date().toLocaleDateString() ? `<span class="pill">Happening Now</span>` : ''}</time>
            <div class="_wrapper">
              <img src="${DOMPurify.sanitize(imageUrl)}" alt="Event Thumbnail"
                class="event-thumbnail">
              <div>
                <span>${DOMPurify.sanitize(event.name)}</span>
                <span>${DOMPurify.sanitize(event.location)}</span>
                <!-- something else if there to add -->
              </div>
            </div>
          </div>
        </a>`;
}

function deleteEvent(eventId) {
  const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
  if (eventElement) {
    eventElement.remove();
  }
}