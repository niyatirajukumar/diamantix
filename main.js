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
            <time datetime="${DOMPurify.sanitize(event.date)}" class="_time"><div class="icon-group">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"
                fill="#e8eaed">
                <path
                  d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm280-240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
              </svg><span>${DOMPurify.sanitize(formattedDate)}</span></div>${new Date(event.date).toLocaleDateString() == new Date().toLocaleDateString() ? `<span class="pill">Happening Now</span>` : ''}</time>
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