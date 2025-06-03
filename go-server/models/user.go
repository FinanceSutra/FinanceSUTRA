package models



import (
    "time"
    "gorm.io/gorm"
    "github.com/google/uuid"
    "golang.org/x/crypto/bcrypt"
)

type User struct {
    gorm.Model
    ID                   uuid.UUID `gorm:"type:uuid;primaryKey"` // UUID as PK
    Username             string    `gorm:"unique;not null"`
    Password             string    `gorm:"not null" json:"-"` 
    Email                string    `gorm:"unique;not null"`
    FullName             string
    CreatedAt            time.Time `gorm:"not null;default:current_timestamp"`
    StripeCustomerID     string    `gorm:"unique"`
    StripeSubscriptionID string
    SubscriptionStatus   string    `gorm:"default:inactive"`
    Plan                 string    `gorm:"default:free"`
}

func (user *User) BeforeCreate(tx *gorm.DB) (err error) {
    if user.ID == uuid.Nil {
        user.ID = uuid.New()
    }
    // Hash and salt the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)

	return nil

}

